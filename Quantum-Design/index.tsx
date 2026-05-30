/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//Vibe coded by ammaar@google.com

import { GoogleGenAI, Type } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import './index.css';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { Artifact, Session, ComponentVariation, LayoutOption, SavedArtifact, Folder } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import { INITIAL_PLACEHOLDERS } from './constants';
import { useBaseDNA } from './src/hooks/useBaseDNA';
import { generateId, playTechSound, playTacticalFrequency } from './utils';
import { loadSettings, saveSettings, generateContent, generateContentStream, ModelSettings, DEFAULT_SETTINGS, fetchModelsForProvider } from './aiService';

import StarfieldBackground from './components/StarfieldBackground';
import ArtifactCard from './components/ArtifactCard';
import SideDrawer from './components/SideDrawer';
import { BootSequence } from './components/BootSequence';
import { 
    ThinkingIcon, 
    CodeIcon, 
    SparklesIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    ArrowUpIcon, 
    ArrowDownIcon,
    GridIcon,
    DownloadIcon,
    CopyIcon,
    CheckIcon,
    InfoIcon,
    HeartIcon,
    FolderIcon,
    PlusIcon,
    LibraryIcon,
    ClockIcon,
    RotateCcwIcon,
    LockIcon,
    VaultIcon
} from './components/Icons';

// Polyfill for chrome.runtime.onMessage to suppress errors from external/extension scripts
if (typeof window !== 'undefined') {
    try {
        if (!(window as any).chrome) (window as any).chrome = {};
        if (!(window as any).chrome.runtime) (window as any).chrome.runtime = {};
        if (!(window as any).chrome.runtime.onMessage) {
            (window as any).chrome.runtime.onMessage = {
                addListener: () => {},
                removeListener: () => {},
                hasListener: () => false,
            };
        }
    } catch (e) {
        console.warn("Failed to polyfill chrome.runtime", e);
    }
}

const MAX_HISTORY_SESSIONS = 50;
const FOLDER_COLORS = [
    '#FF5F1F', // Neon Orange
    '#00E5FF', // Cyan
    '#FF00FF', // Magenta
    '#39FF14', // Lime
    '#FFD700', // Gold
    '#7B68EE', // Medium Slate Blue
    '#FF4500', // Orange Red
    '#00FA9A', // Medium Spring Green
];

const COMMUNITY_DESIGNS = [
  {
    id: 'design-aurora-canvas',
    name: 'Bioluminescent Canvas Aurora',
    category: 'shaders',
    description: 'Dynamic math-driven animated wave shader utilizing native HTML5 Canvas drawing.',
    author: 'Quantum_Core',
    bookmarks: 142,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #000;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: 'Orbitron', sans-serif;
    }
    canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    .label {
      position: relative;
      z-index: 2;
      color: #00E5FF;
      font-size: 1.2rem;
      text-transform: uppercase;
      letter-spacing: 4px;
      text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
      border: 1px solid rgba(0, 229, 255, 0.3);
      padding: 10px 20px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(10px);
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="label">AURORA_WAVES_V4</div>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    let phase = 0;
    function animate() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, width, height);

      const numWaves = 5;
      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        ctx.lineWidth = i === 0 ? 3 : 1;
        const alpha = 0.1 + (i / numWaves) * 0.4;
        ctx.strokeStyle = \`rgba(0, 229, 255, \${alpha})\`;
        
        const frequency = 0.002 + i * 0.001;
        const amplitude = 50 + i * 20;

        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * frequency + phase + i) * amplitude * Math.cos(x * 0.0005 + phase * 0.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += 0.02;
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`
  },
  {
    id: 'design-cyber-mesh',
    name: 'Interactive Glowing Mesh Grid',
    category: 'shaders',
    description: 'An interactive canvas grid network responsive to mouse cursor and glowing node links.',
    author: 'Quantum_Core',
    bookmarks: 98,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #010409; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="mesh"></canvas>
  <script>
    const canvas = document.getElementById('mesh');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const points = [];
    const maxDist = 120;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    for(let i=0; i<80; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5
      });
    }

    let mouse = { x: null, y: null };
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    function draw() {
      ctx.fillStyle = '#010409';
      ctx.fillRect(0,0,width,height);

      points.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if(p.x < 0 || p.x > width) p.vx *= -1;
        if(p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
        ctx.fillStyle = '#FF5F1F';
        ctx.fill();
      });

      for(let i=0; i<points.length; i++) {
        for(let j=i+1; j<points.length; j++) {
          const p1 = points[i];
          const p2 = points[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.3;
            ctx.strokeStyle = \`rgba(0, 229, 255, \${alpha})\`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  </script>
</body>
</html>`
  },
  {
    id: 'design-ai-chat-glass',
    name: 'Quantum Glassmorphic AI Chat',
    category: 'ai-chat',
    description: 'Hyper-premium chat user interface featuring sliding card layers, glassmorphism, and a neon input bar.',
    author: 'Lcars_Alchemist',
    bookmarks: 167,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: linear-gradient(135deg, #02000a 0%, #050515 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: #fff;
    }
    .chat-container {
      width: 400px;
      height: 500px;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .chat-header {
      padding: 15px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-weight: bold;
      color: #00E5FF;
      letter-spacing: 1px;
      font-size: 0.9rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #39FF14;
      border-radius: 50%;
      box-shadow: 0 0 10px #39FF14;
      animation: pulse 1s infinite alternate;
    }
    @keyframes pulse { from { opacity: 0.3; } to { opacity: 1; } }
    .chat-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .message {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.85rem;
      line-height: 1.4;
    }
    .message.user {
      background: rgba(0, 229, 255, 0.1);
      border: 1px solid rgba(0, 229, 255, 0.2);
      align-self: flex-end;
    }
    .message.system {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      align-self: flex-start;
    }
    .chat-input-wrapper {
      padding: 15px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .chat-input {
      width: 100%;
      padding: 12px;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #fff;
      font-size: 0.85rem;
      outline: none;
      box-sizing: border-box;
      transition: all 0.3s;
    }
    .chat-input:focus {
      border-color: #00E5FF;
      box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
    }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="chat-header">
      <span>QUANTUM_NEURAL_LINK</span>
      <div class="pulse-dot"></div>
    </div>
    <div class="chat-messages">
      <div class="message system">HANDSHAKE_COMPLETED. State parameters stabilized. How can I facilitate your interface design protocol today?</div>
      <div class="message user">Synthesize a glowing bio-tech button sequence.</div>
      <div class="message system">Compiling layout elements... Vector matrices verified. Ready for export.</div>
    </div>
    <div class="chat-input-wrapper">
      <input class="chat-input" type="text" placeholder="Transmit instructions to host..." />
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'design-biolume-pricing',
    name: 'Bioluminescent Pricing Cards',
    category: 'pricing',
    description: 'A beautiful three-column tier pricing UI with pulsing neon card borders and hover reactions.',
    author: 'Lcars_Alchemist',
    bookmarks: 85,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #05050e;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #fff;
    }
    .pricing-grid {
      display: flex;
      gap: 20px;
    }
    .pricing-card {
      width: 180px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      padding: 30px 20px;
      border-radius: 16px;
      text-align: center;
      transition: all 0.3s ease;
      position: relative;
    }
    .pricing-card:hover {
      transform: translateY(-8px);
      background: rgba(255,255,255,0.05);
      border-color: #00E5FF;
      box-shadow: 0 10px 30px rgba(0, 229, 255, 0.25);
    }
    .pricing-card.premium {
      border-color: #FF5F1F;
    }
    .pricing-card.premium:hover {
      border-color: #FF5F1F;
      box-shadow: 0 10px 30px rgba(255, 95, 31, 0.25);
    }
    .price {
      font-size: 2rem;
      font-weight: 800;
      margin: 15px 0;
    }
    .btn {
      display: block;
      padding: 10px;
      background: #00E5FF;
      color: #000;
      text-decoration: none;
      font-weight: bold;
      border-radius: 6px;
      font-size: 0.8rem;
      margin-top: 20px;
      transition: opacity 0.2s;
    }
    .premium .btn {
      background: #FF5F1F;
    }
    .btn:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="pricing-grid">
    <div class="pricing-card">
      <div style="font-size: 0.75rem; opacity: 0.6; text-transform: uppercase;">Standard</div>
      <div class="price">$19</div>
      <div style="font-size: 0.7rem; opacity: 0.8;">Single core pipeline compiled templates included.</div>
      <a href="#" class="btn">INITIALIZE</a>
    </div>
    <div class="pricing-card premium">
      <div style="font-size: 0.75rem; color: #FF5F1F; font-weight: bold; text-transform: uppercase;">Pro Pipeline</div>
      <div class="price" style="color: #FF5F1F;">$49</div>
      <div style="font-size: 0.7rem; opacity: 0.8;">Unrestricted thread synthesis. Fully customizable modules.</div>
      <a href="#" class="btn">COMPILE_NOW</a>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'design-3d-testimonials',
    name: '3D Flip Testimonials Grid',
    category: 'testimonials',
    description: 'True 3D card layout rotation that flips 180 degrees to show comprehensive review details.',
    author: 'Quantum_Core',
    bookmarks: 110,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #020205;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: sans-serif;
      perspective: 1000px;
    }
    .card-container {
      width: 250px;
      height: 200px;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }
    .card-container:hover {
      transform: rotateY(180deg);
    }
    .card-face {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
    }
    .front {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      color: #fff;
    }
    .back {
      background: #00E5FF;
      color: #000;
      transform: rotateY(180deg);
    }
    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 2px solid #00E5FF;
    }
  </style>
</head>
<body>
  <div class="card-container">
    <div class="card-face front">
      <div class="avatar">CK</div>
      <strong>Commander Kor</strong>
      <div style="font-size: 0.75rem; opacity: 0.6; margin-top: 5px;">TNG UI Architect</div>
    </div>
    <div class="card-face back">
      <strong style="font-size: 0.95rem;">"CRITICAL PROTOCOL"</strong>
      <p style="font-size: 0.75rem; text-align: center; margin-top: 10px; line-height: 1.4;">"Quantum Design compiles our tactile interfaces 10x faster than traditional terminal scripting. Absolute perfection!"</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'design-lcars-nav',
    name: 'Retro-Futuristic LCARS Navigation',
    category: 'navigation',
    description: 'A genuine slide-out overlay navbar designed with classic LCARS geometric frames and beep sound animations.',
    author: 'Quantum_Core',
    bookmarks: 231,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #000;
      font-family: Arial, Helvetica, sans-serif;
      overflow: hidden;
      height: 100vh;
    }
    .nav-container {
      display: flex;
      height: 60px;
      background: #000;
      align-items: center;
      padding: 0 10px;
      border-bottom: 3px solid #ffcc33;
    }
    .nav-brand {
      color: #ffcc33;
      font-weight: bold;
      font-size: 1.2rem;
      margin-right: 20px;
      letter-spacing: 1px;
    }
    .nav-btn {
      padding: 6px 16px;
      background: #00ffcc;
      color: #000;
      font-weight: bold;
      border-radius: 12px;
      font-size: 0.8rem;
      border: none;
      cursor: pointer;
      margin-right: 8px;
      transition: all 0.2s;
    }
    .nav-btn:hover {
      background: #fff;
    }
    .nav-btn.gold {
      background: #ffaa00;
    }
  </style>
</head>
<body>
  <div class="nav-container">
    <div class="nav-brand">LCARS_PORTAL_V1</div>
    <button class="nav-btn">SYS_EXEC</button>
    <button class="nav-btn gold">VAULT_PULL</button>
    <button class="nav-btn">DIAG_RUN</button>
  </div>
</body>
</html>`
  },
  {
    id: 'design-mesh-gradient-hero',
    name: 'Mesh Gradient Dynamic Background',
    category: 'backgrounds',
    description: 'Breathtaking CSS radial mesh gradient circles moving slowly to create a high-fidelity visual experience.',
    author: 'Lcars_Alchemist',
    bookmarks: 145,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #01020d;
      height: 100vh;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .mesh-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      filter: blur(80px);
    }
    .circle {
      position: absolute;
      border-radius: 50%;
      mix-blend-mode: screen;
      opacity: 0.4;
      animation: move 20s infinite alternate ease-in-out;
    }
    .circle-1 {
      width: 300px;
      height: 300px;
      background: #00E5FF;
      top: 10%;
      left: 10%;
    }
    .circle-2 {
      width: 400px;
      height: 400px;
      background: #FF00FF;
      bottom: 10%;
      right: 10%;
      animation-delay: -5s;
    }
    .label {
      position: relative;
      z-index: 2;
      color: #fff;
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: 5px;
      text-transform: uppercase;
      font-family: sans-serif;
    }
    @keyframes move {
      0% { transform: translate(0,0) scale(1); }
      100% { transform: translate(150px, 100px) scale(1.2); }
    }
  </style>
</head>
<body>
  <div class="mesh-bg">
    <div class="circle circle-1"></div>
    <div class="circle circle-2"></div>
  </div>
  <div class="label">HYPER_VISUALS</div>
</body>
</html>`
  },
  {
    id: 'design-cyber-shimmer-text',
    name: 'Cyber-Glow Shimmer Text Reveal',
    category: 'texts',
    description: 'Header text elements showcasing interactive shimmer lights, typing indicators, and futuristic border transitions.',
    author: 'Quantum_Core',
    bookmarks: 112,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: sans-serif;
    }
    .shimmer-text {
      font-size: 2rem;
      font-weight: bold;
      color: rgba(255,255,255,0.1);
      background: linear-gradient(120deg, transparent 30%, #00e5ff 50%, transparent 70%);
      background-size: 200% 100%;
      -webkit-background-clip: text;
      animation: shimmer 3s infinite linear;
      letter-spacing: 3px;
    }
    @keyframes shimmer {
      0% { background-position: -150% 0; }
      100% { background-position: 150% 0; }
    }
  </style>
</head>
<body>
  <h1 class="shimmer-text">QUANTUM_TRANSMISSION_ACTIVE</h1>
</body>
</html>`
  }
];

const PORTAL_CATEGORIES = [
  { id: 'all', name: 'All Components', count: COMMUNITY_DESIGNS.length, group: 'Discover' },
  { id: 'popular', name: 'Popular', count: COMMUNITY_DESIGNS.filter(d => d.bookmarks > 100).length, group: 'Discover' },
  { id: 'featured', name: 'Featured', count: 3, group: 'Discover' },
  { id: 'new', name: 'New of the Day', count: 2, group: 'Discover' },
  { id: 'themes', name: 'Themes', count: 12, group: 'Discover' },
  { id: 'top-authors', name: 'Top Authors', count: 8, group: 'Discover' },

  { id: 'announcements', name: 'Announcements', count: 22, group: 'Components' },
  { id: 'backgrounds', name: 'Backgrounds', count: 45, group: 'Components' },
  { id: 'borders', name: 'Borders', count: 12, group: 'Components' },
  { id: 'buttons', name: 'Buttons', count: 140, group: 'Components' },
  { id: 'cards', name: 'Cards', count: 88, group: 'Components' },
  { id: 'carousels', name: 'Carousels', count: 24, group: 'Components' },
  { id: 'charts', name: 'Charts', count: 18, group: 'Components' },
  { id: 'device-mockups', name: 'Device Mockups', count: 11, group: 'Components' },
  { id: 'dialogs', name: 'Dialogs / Modals', count: 21, group: 'Components' },
  { id: 'footers', name: 'Footers', count: 15, group: 'Components' },
  { id: 'grids', name: 'Grids', count: 30, group: 'Components' },
  { id: 'inputs', name: 'Inputs', count: 75, group: 'Components' },
  { id: 'menus', name: 'Menus', count: 48, group: 'Components' },
  { id: 'navigation', name: 'Navigation Menus', count: 32, group: 'Components' },
  { id: 'pricing', name: 'Pricing Sections', count: 18, group: 'Components' },
  { id: 'scroll-areas', name: 'Scroll Areas', count: 22, group: 'Components' },
  { id: 'sidebars', name: 'Sidebars', count: 15, group: 'Components' },
  { id: 'tables', name: 'Tables', count: 25, group: 'Components' },
  { id: 'tabs', name: 'Tabs', count: 18, group: 'Components' },
  { id: 'testimonials', name: 'Testimonials', count: 24, group: 'Components' },
  { id: 'texts', name: 'Text Animations', count: 35, group: 'Components' },
  { id: 'tooltips', name: 'Tooltips', count: 12, group: 'Components' },
  { id: 'widgets', name: 'Widgets', count: 40, group: 'Components' },
  { id: 'shaders', name: 'Shaders & WebGL', count: 12, group: 'Components' },
  { id: 'ai-chat', name: 'AI Chat Components', count: 10, group: 'Components' }
];

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [isActionBarCollapsed, setIsActionBarCollapsed] = useState(true);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(() => {
      try {
          const saved = localStorage.getItem('alchemy_history');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          console.warn("LocalStorage blocked", e);
          return [];
      }
  });
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(-1);
  const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);
  
  // ARTIFACT_OS v7.0.0_RESTRUCTURE STATES
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(false);
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [isBottomInputOpen, setIsBottomInputOpen] = useState(false);
  const [shellTransform, setShellTransform] = useState({ rotateX: 0, rotateY: 0 });

  const [modelSettings, setModelSettings] = useState<ModelSettings>(loadSettings);

  // --- QUANTUM DESIGN NEW STATE SIGNALS ---
  const [starfieldSpeed, setStarfieldSpeed] = useState(40);
  const [starfieldAmount, setStarfieldAmount] = useState(1200);
  const [isWarping, setIsWarping] = useState(false);

  // Side Drawer tab-flip animations state
  const [drawerFlipActive, setDrawerFlipActive] = useState(false);

  // Overhauled Community Portal Modal states
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [portalCategory, setPortalCategory] = useState('all');
  const [portalSearch, setPortalSearch] = useState('');
  const [portalViewMode, setPortalViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [portalGridDensity, setPortalGridDensity] = useState<number>(2); // 1 = Compact, 2 = Standard, 3 = Detailed
  const [bookmarkedDesigns, setBookmarkedDesigns] = useState<Record<string, boolean>>({});
  const [privateDesigns, setPrivateDesigns] = useState<Record<string, boolean>>({});

  // Dynamic model selections
  const [dynamicModels, setDynamicModels] = useState<Record<string, { id: string; name: string }[]>>({});
  const [isFetchingModels, setIsFetchingModels] = useState<Record<string, boolean>>({
    gemini: false, openai: false, claude: false, grok: false, openrouter: false, vertex: false
  });
  const [modelFetchError, setModelFetchError] = useState<Record<string, string>>({
    gemini: '', openai: '', claude: '', grok: '', openrouter: '', vertex: ''
  });

  const fetchingRef = useRef<Record<string, boolean>>({});

  const [testStatus, setTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' });
  
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'info' | 'protocol' } | null>(null);
  
  // SYSTEM OVERSIGHT: Detailed Debug Log capture for debugging in isolation
  const [sysFaults, setSysFaults] = useState<{id: string; time: string; type: string; message: string; stack?: string}[]>([]);

  const [drawerState, setDrawerState] = useState<{
      isOpen: boolean;
      mode: 'code' | 'variations' | 'explain' | 'library' | 'save-to-folder' | 'history' | 'sound-lab' | 'settings' | null;
      title: string;
      data: any;
      artifact?: Artifact;
      prompt?: string;
  }>({ isOpen: false, mode: null, title: '', data: null });

  const [showVertexOverride, setShowVertexOverride] = useState(false);

  const [inputMode, setInputMode] = useState<'prompt' | 'revise'>('prompt');
  const { baseRef, setBase, clearBase, undoBase, getBaseArtifact } = useBaseDNA(sessions);

  const [savedArtifacts, setSavedArtifacts] = useState<SavedArtifact[]>(() => {
      try {
          const saved = localStorage.getItem('alchemy_artifacts');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          console.warn("LocalStorage blocked", e);
          return [];
      }
  });
  const [folders, setFolders] = useState<Folder[]>(() => {
      try {
          const saved = localStorage.getItem('alchemy_folders');
          if (!saved) return [];
          const parsed = JSON.parse(saved);
          return parsed.map((f: any) => typeof f === 'string' ? { id: generateId(), name: f } : f).filter((f: any) => f.name);
      } catch (e) {
          console.warn("LocalStorage blocked", e);
          return [];
      }
  });

  const [selectedLibraryFolderId, setSelectedLibraryFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState('');

  // Sync settings when they change
  useEffect(() => {
      saveSettings(modelSettings);
  }, [modelSettings]);

  // Sync initial bookmarks state on load/sync
  useEffect(() => {
    const initialBookmarks: Record<string, boolean> = {};
    savedArtifacts.forEach(art => {
      if (art.id && art.id.startsWith('design-')) {
        initialBookmarks[art.id] = true;
      }
    });
    setBookmarkedDesigns(initialBookmarks);
  }, [savedArtifacts]);

  // --- QUANTUM DESIGN NEW HANDLERS ---
  const loadModelsForActiveProvider = useCallback(async (provider: 'gemini' | 'openai' | 'claude' | 'grok' | 'openrouter' | 'vertex') => {
    if (fetchingRef.current[provider]) return;

    const key = (() => {
      switch (provider) {
        case 'gemini': return modelSettings.gemini.apiKey;
        case 'openai': return modelSettings.openai.apiKey;
        case 'claude': return modelSettings.claude.apiKey;
        case 'grok': return modelSettings.grok.apiKey;
        case 'openrouter': return modelSettings.openrouter.apiKey;
        case 'vertex': return modelSettings.vertex.serviceAccountJson;
        default: return '';
      }
    })();

    // For gemini & vertex, we can allow fetching even if key is empty because gemini can fall back to env variables.
    if (!key && provider !== 'gemini' && provider !== 'vertex') {
      return;
    }

    fetchingRef.current[provider] = true;
    setIsFetchingModels(prev => ({ ...prev, [provider]: true }));
    setModelFetchError(prev => ({ ...prev, [provider]: '' }));

    try {
      const fetched = await fetchModelsForProvider(provider, modelSettings);
      if (fetched && fetched.length > 0) {
        setDynamicModels(prev => ({ ...prev, [provider]: fetched }));
        
        // If current model is not in fetched list, auto-select the first one
        const modelExists = fetched.some(m => m.id === modelSettings[provider].model);
        if (!modelExists && fetched[0]) {
          setModelSettings(prev => ({
            ...prev,
            [provider]: { ...prev[provider], model: fetched[0].id }
          }));
        }
      } else {
        throw new Error("No available models found");
      }
    } catch (err: any) {
      console.warn(`Failed to fetch models for ${provider}, using fallback list`, err);
      const errMsg = err?.message || 'Connection handshake failed';
      setModelFetchError(prev => ({ ...prev, [provider]: errMsg }));
      setNotification({ message: `API ERROR: INVALID API KEY OR NETWORK FAILURE FOR ${provider.toUpperCase()}`, type: 'error' });
    } finally {
      fetchingRef.current[provider] = false;
      setIsFetchingModels(prev => ({ ...prev, [provider]: false }));
    }
  }, [modelSettings]);

  // Auto-fetch models when provider keys change (debounced)
  useEffect(() => {
    const activeProvider = modelSettings.activeProvider;
    const key = (() => {
      switch (activeProvider) {
        case 'gemini': return modelSettings.gemini.apiKey;
        case 'openai': return modelSettings.openai.apiKey;
        case 'claude': return modelSettings.claude.apiKey;
        case 'grok': return modelSettings.grok.apiKey;
        case 'openrouter': return modelSettings.openrouter.apiKey;
        case 'vertex': return modelSettings.vertex.serviceAccountJson;
        default: return '';
      }
    })();

    // For gemini & vertex, we can allow fetching even if key is empty because gemini can fall back to env variables.
    if (!key && activeProvider !== 'gemini' && activeProvider !== 'vertex') {
      return;
    }

    const timer = setTimeout(() => {
      loadModelsForActiveProvider(activeProvider);
    }, 1000); // 1.0s debounce

    return () => clearTimeout(timer);
  }, [
    modelSettings.activeProvider,
    modelSettings.gemini.apiKey,
    modelSettings.openai.apiKey,
    modelSettings.claude.apiKey,
    modelSettings.grok.apiKey,
    modelSettings.openrouter.apiKey,
    modelSettings.vertex.serviceAccountJson,
    loadModelsForActiveProvider
  ]);

  const handleCommandCenterWarp = useCallback(() => {
    setDrawerState({ isOpen: false, mode: null, title: '', data: null });
    setIsPortalOpen(false);
    setIsWarping(true);
    setStarfieldSpeed(180);
    setStarfieldAmount(3000);
    setInputValue('');
    setInputMode('prompt');
    playTechSound('warp');
    
    setTimeout(() => {
      setStarfieldSpeed(40);
      setStarfieldAmount(1200);
      setIsWarping(false);
    }, 1200);
  }, []);

  const handleDrawerTabSwitch = useCallback((newMode: 'library' | 'history', newTitle: string) => {
    if (drawerState.mode === newMode) return;
    setDrawerFlipActive(true);
    playTechSound('scanning');
    
    setTimeout(() => {
      setDrawerState(prev => ({
        ...prev,
        mode: newMode,
        title: newTitle
      }));
    }, 250);
    
    setTimeout(() => {
      setDrawerFlipActive(false);
    }, 500);
  }, [drawerState.mode]);

  const handleBookmarkDesign = useCallback((design: any) => {
    playTechSound('boot');
    setBookmarkedDesigns(prev => {
      const updated = { ...prev, [design.id]: !prev[design.id] };
      if (updated[design.id]) {
        const isAlreadySaved = savedArtifacts.some(art => art.id === design.id);
        if (!isAlreadySaved) {
          setSavedArtifacts(prevArts => [...prevArts, {
            id: design.id,
            name: design.name,
            html: design.html,
            folderId: null,
            timestamp: Date.now(),
            isFavorite: true
          }]);
        }
        setNotification({ message: `SAVED TO VAULT: ${design.name.toUpperCase()}`, type: 'protocol' });
      } else {
        setSavedArtifacts(prevArts => prevArts.filter(art => art.id !== design.id));
        setNotification({ message: `REMOVED FROM VAULT: ${design.name.toUpperCase()}`, type: 'info' });
      }
      return updated;
    });
  }, [savedArtifacts]);



  useEffect(() => {
      try {
          localStorage.setItem('alchemy_artifacts', JSON.stringify(savedArtifacts));
      } catch (e) {}
  }, [savedArtifacts]);

  // ARTIFACT_OS ZERO-BLIND-SPOT GLOBAL ERROR MONITORING
  useEffect(() => {
      const handleGlobalError = (event: ErrorEvent) => {
          console.error("GLOBAL RUNTIME FAULT:", event.error || event.message);
          setNotification({ message: `SYS_FAULT: ${event.message}`, type: 'error' });
          setSysFaults(prev => [...prev, { id: generateId(), time: new Date().toLocaleTimeString(), type: 'Global', message: event.message, stack: event.error?.stack }]);
      };
      
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
          console.error("UNHANDLED PROMISE FAULT:", event.reason);
          const msg = event.reason?.message || 'Unknown Promise Rejection';
          setNotification({ message: `ASYNC_FAULT: ${msg}`, type: 'error' });
          setSysFaults(prev => [...prev, { id: generateId(), time: new Date().toLocaleTimeString(), type: 'Promise Rejection', message: msg, stack: event.reason?.stack }]);
      };

      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
          window.removeEventListener('error', handleGlobalError);
          window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
  }, []);

  useEffect(() => {
      try {
          localStorage.setItem('alchemy_folders', JSON.stringify(folders));
      } catch (e) {}
  }, [folders]);

  useEffect(() => {
      try {
          localStorage.setItem('alchemy_history', JSON.stringify(sessions));
      } catch (e) {}
  }, [sessions]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xAxis = (window.innerWidth / 2 - e.pageX) / 100;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 100;
      setShellTransform({ rotateX: -yAxis, rotateY: xAxis });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleFavorite = useCallback((sessionId: string, artifactId: string) => {
      setSessions(prev => prev.map(sess => {
          if (sess.id === sessionId) {
              return {
                  ...sess,
                  artifacts: sess.artifacts.map(art => {
                      if (art.id === artifactId) {
                          return { ...art, isFavorite: !art.isFavorite };
                      }
                      return art;
                  })
              };
          }
          return sess;
      }));
      
      setSavedArtifacts(prev => prev.map(art => {
          if (art.id === artifactId) {
              return { ...art, isFavorite: !art.isFavorite };
          }
          return art;
      }));
  }, []);

  const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isActionBarCopied, setIsActionBarCopied] = useState(false);

  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
  const [variationStyle, setVariationStyle] = useState('Cyberpunk');
  const [customVariationStyle, setCustomVariationStyle] = useState('');
  const [variationTheme, setVariationTheme] = useState('Dark');
  const [customVariationTheme, setCustomVariationTheme] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  // Reset copy state when drawer closes
  useEffect(() => {
      if (!drawerState.isOpen) setIsCopied(false);
  }, [drawerState.isOpen]);

  // Fix for mobile: reset scroll when focusing an item to prevent "overscroll" state
  useEffect(() => {
    if (focusedArtifactIndex !== null || drawerState.isOpen) {
        setIsSidebarCollapsed(true);
        setIsInputCollapsed(true);
        if (focusedArtifactIndex !== null && window.innerWidth <= 1024) {
            if (gridScrollRef.current) {
                gridScrollRef.current.scrollTop = 0;
            }
            window.scrollTo(0, 0);
        }
    } else {
        setIsSidebarCollapsed(false);
        setIsInputCollapsed(false);
    }
  }, [focusedArtifactIndex, drawerState.isOpen]);

    // Cycle placeholders
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [placeholders.length]);

    // Dynamic placeholder generation on load
    useEffect(() => {
        const fetchDynamicPlaceholders = async () => {
            try {
                const text = await generateContent({
                    prompt: 'Generate 20 creative, short, diverse UI component prompts (e.g. "bioluminescent task list"). Return ONLY a raw JSON array of strings. IP SAFEGUARD: Avoid referencing specific famous artists, movies, or brands.'
                });
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const newPlaceholders = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(newPlaceholders) && newPlaceholders.length > 0) {
                        const shuffled = newPlaceholders.sort(() => 0.5 - Math.random()).slice(0, 10);
                        setPlaceholders(prev => [...prev, ...shuffled]);
                    }
                }
            } catch (e) {
                console.warn("Silently failed to fetch dynamic placeholders", e);
            }
        };
        setTimeout(fetchDynamicPlaceholders, 1000);
    }, []);

    const VARIATION_STYLES = [
        "Cyberpunk", "Minimalist", "Neumorphic", "Glassmorphism", "Retro/Synthwave",
        "Brutalist", "Bauhaus", "Swiss Modern", "Skeuomorphic", "Vaporwave",
        " Solarized", "Nord", "Dracula", "Material Design", "Flat Design",
        "8-bit / Pixel Art", "Art Deco", "Steampunk", "Bio-organic", "Holographic",
        "Cyber-Y2K", "Acid Graphic", "Corporate Memphis", "Claymorphism", "Aurora"
    ];

    const LCARS_SOUNDS = [
        { id: 'tactical', name: 'Tactical Beep', freq: 880, type: 'sine' as OscillatorType, duration: 0.1 },
        { id: 'console', name: 'Console Input', freq: 440, type: 'sine' as OscillatorType, duration: 0.08 },
        { id: 'data', name: 'Data Stream', freq: 1320, type: 'sine' as OscillatorType, duration: 0.05 },
        { id: 'alert', name: 'System Alert', freq: 220, type: 'square' as OscillatorType, duration: 0.3 },
        { id: 'link', name: 'Neural Link', freq: 660, type: 'triangle' as OscillatorType, duration: 0.15 },
        { id: 'warp', name: 'Warp Drive', freq: 60, type: 'sawtooth' as OscillatorType, duration: 0.5 },
        { id: 'comms', name: 'Comms Link', freq: 1100, type: 'sine' as OscillatorType, duration: 0.12 },
        { id: 'shields', name: 'Shield Protocol', freq: 330, type: 'sine' as OscillatorType, duration: 0.4 },
        { id: 'phaser', name: 'Phaser Charge', freq: 1760, type: 'sine' as OscillatorType, duration: 0.2 },
        { id: 'chirp', name: 'Interface Chirp', freq: 2200, type: 'sine' as OscillatorType, duration: 0.05 },
        { id: 'hum', name: 'Ambient Core', freq: 50, type: 'sine' as OscillatorType, duration: 1.0 },
        { id: 'scan', name: 'Sensor Scan', freq: 440, type: 'sine' as OscillatorType, duration: 0.8, sweep: true },
        { id: 'boot', name: 'System Boot', freq: 100, type: 'sawtooth' as OscillatorType, duration: 2.0 },
    ];

    const playPreviewSound = (sound: typeof LCARS_SOUNDS[0]) => {
        if (['warp', 'comms', 'shield', 'scanning', 'tactical', 'ambient_hum', 'boot', 'generate', 'success', 'error'].includes(sound.id)) {
            playTechSound(sound.id as any);
        } else {
            playTacticalFrequency(sound.freq, sound.duration, sound.type, (sound as any).sweep);
        }
    };

    const handleDownloadSound = async (sound: typeof LCARS_SOUNDS[0]) => {
        try {
            const sampleRate = 44100;
            const duration = sound.duration;
            const length = Math.floor(sampleRate * duration);
            const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
            
            const osc = offlineCtx.createOscillator();
            const gain = offlineCtx.createGain();
            
            osc.type = sound.type;
            osc.frequency.setValueAtTime(sound.freq, 0);
            if ((sound as any).sweep) {
                osc.frequency.exponentialRampToValueAtTime(sound.freq * 2, duration);
            }
            
            gain.gain.setValueAtTime(0.5, 0);
            gain.gain.exponentialRampToValueAtTime(0.01, duration);
            
            osc.connect(gain);
            gain.connect(offlineCtx.destination);
            
            osc.start();
            osc.stop(duration);
            
            const renderedBuffer = await offlineCtx.startRendering();
            
            // Simple WAV encoder
            const buffer = renderedBuffer.getChannelData(0);
            const wavBuffer = new ArrayBuffer(44 + buffer.length * 2);
            const view = new DataView(wavBuffer);
            
            const writeString = (offset: number, string: string) => {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            };
            
            writeString(0, 'RIFF');
            view.setUint32(4, 36 + buffer.length * 2, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeString(36, 'data');
            view.setUint32(40, buffer.length * 2, true);
            
            let offset = 44;
            for (let i = 0; i < buffer.length; i++) {
                const sample = Math.max(-1, Math.min(1, buffer[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
            
            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lcars_${sound.id}.wav`;
            a.click();
            URL.revokeObjectURL(url);
            
            setNotification({ message: `Sound protocol ${sound.id.toUpperCase()} downloaded.`, type: 'protocol' });
        } catch (e) {
            console.error("Download failed", e);
            setNotification({ message: "Download protocol failed.", type: 'error' });
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
    };

  const parseJsonStream = async function* (responseStream: AsyncGenerator<{ text: string }>) {
      let buffer = '';
      for await (const chunk of responseStream) {
          const text = chunk.text;
          if (typeof text !== 'string') continue;
          buffer += text;
          let braceCount = 0;
          let start = buffer.indexOf('{');
          while (start !== -1) {
              braceCount = 0;
              let end = -1;
              for (let i = start; i < buffer.length; i++) {
                  if (buffer[i] === '{') braceCount++;
                  else if (buffer[i] === '}') braceCount--;
                  if (braceCount === 0 && i > start) {
                      end = i;
                      break;
                  }
              }
              if (end !== -1) {
                  const jsonString = buffer.substring(start, end + 1);
                  try {
                      yield JSON.parse(jsonString);
                      buffer = buffer.substring(end + 1);
                      start = buffer.indexOf('{');
                  } catch (e) {
                      start = buffer.indexOf('{', start + 1);
                  }
              } else {
                  break; 
              }
          }
      }
  };

  const handleDownload = async (html: string, filename: string, artifact?: Artifact, sessionPrompt?: string) => {
      setNotification({ message: "Initializing download protocol...", type: 'protocol' });
      
      try {
          const zip = new JSZip();
          
          // 1. HTML Source
          const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename.replace('.html', '')}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #000; color: #fff; }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
          zip.file("index.html", fullHtml);

          // 2. README.md
          const readmeContent = `# UI Artifact: ${artifact?.styleName || 'Generated Design'}

This artifact was generated using **UI/UX FLASH BY BOO**.

## Implementation Instructions

1. **Extract the files**: Unzip this package into your project directory.
2. **Include the HTML**: Copy the content of \`index.html\` into your project.
3. **Styles**: The styles are self-contained within the \`<style>\` tag in the HTML file. You can move them to your global CSS file if preferred.
4. **Dependencies**: This artifact is designed to be self-contained. It uses standard CSS and HTML.

## Best Practices for Best Results

- **Responsive Design**: Test the artifact on different screen sizes. You may need to adjust some media queries for your specific layout.
- **Accessibility**: Ensure that color contrast ratios meet WCAG standards for readability.
- **Performance**: Minimize the use of heavy animations if targeting low-end devices.
- **Integration**: If using a framework like React or Vue, convert the HTML/CSS into reusable components.
- **Theming**: Use CSS variables for colors to make it easier to switch themes later.

## AI Builder Prompt

You can use the following prompt in an AI builder (like Gemini or ChatGPT) to recreate or iterate on this design:

\`\`\`json
${JSON.stringify({ 
    prompt: sessionPrompt || "Generate a high-fidelity UI component.",
    style: artifact?.styleName || "Modern UI",
    timestamp: new Date().toISOString()
}, null, 2)}
\`\`\`
`;
          zip.file("README.md", readmeContent);

          // 3. Prompt JSON
          const promptJson = JSON.stringify({ 
              originalPrompt: sessionPrompt,
              styleName: artifact?.styleName,
              generatedAt: new Date().toISOString(),
              engine: "UI/UX FLASH BY BOO"
          }, null, 2);
          zip.file("prompt.json", promptJson);

          // 4. Screenshot
          const container = document.createElement('div');
          container.style.position = 'fixed';
          container.style.top = '0';
          container.style.left = '-9999px';
          container.style.width = '1200px';
          container.style.minHeight = '800px';
          container.style.background = '#000';
          container.innerHTML = html;
          document.body.appendChild(container);

          try {
              const canvas = await html2canvas(container, {
                  useCORS: true,
                  backgroundColor: '#000',
                  scale: 1.5,
                  logging: false
              });
              const imgData = canvas.toDataURL("image/png").split(',')[1];
              zip.file("screenshot.png", imgData, {base64: true});
          } catch (screenshotError) {
              console.error("Screenshot capture failed:", screenshotError);
          } finally {
              document.body.removeChild(container);
          }

          // 5. Generate and Download
          const content = await zip.generateAsync({type:"blob"});
          const url = URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename.replace('.html', '')}_package.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setNotification({ message: "Vault Package Downloaded Successfully", type: 'protocol' });
      } catch (error) {
          console.error("Download failed:", error);
          setNotification({ message: "Download Protocol Failed", type: 'error' });
      }
  };

  const handleCopyCode = async (text: string, isFromActionBar: boolean = false) => {
      const setCopied = isFromActionBar ? setIsActionBarCopied : setIsCopied;
      
      try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            playTechSound('success');
            return;
        }
        throw new Error("Clipboard API unavailable");
      } catch (e) {
          // Fallback for mobile/non-secure/iframe contexts
          try {
              const textArea = document.createElement("textarea");
              textArea.value = text;
              textArea.style.position = "fixed";
              textArea.style.left = "-9999px";
              textArea.style.top = "0";
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              const successful = document.execCommand('copy');
              document.body.removeChild(textArea);
              if (successful) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  playTechSound('success');
              }
          } catch (err) {
              console.error("Fallback copy failed", err);
          }
      }
  };

   const handleGenerateVariations = useCallback(async (style: string, theme: string) => {
    let targetSession = sessions[currentSessionIndex];
    let targetArtifactIndex = focusedArtifactIndex;

    const base = getBaseArtifact();
    if (base) {
        targetSession = base.session;
        targetArtifactIndex = baseRef!.artifactIndex; // Ensure we use the index from the ref
    }

    if (!targetSession || targetArtifactIndex === null) return;
    const currentArtifact = targetSession.artifacts[targetArtifactIndex];

    setIsLoading(true);
    setIsLoadingVariations(true);
    setComponentVariations([]);
    setDrawerState({ isOpen: true, mode: 'variations', title: 'Neural Variations', data: currentArtifact.id });

    try {
        console.log("Starting variation generation for style:", style, "theme:", theme);

        const prompt = `
You are a Master AI Architect. Generate 3 RADICAL CONCEPTUAL VARIATIONS of the provided UI.

**BASE UI DNA (KEEP THIS LOGIC AND CONTENT):**
<<<BASE_HTML
${currentArtifact.html}
BASE_HTML>>>

**USER SPECIFICATIONS (APPLY THIS NEW VISUAL DNA):**
- **Target Style:** ${style}
- **Target Theme:** ${theme}

**STRICT IP SAFEGUARD:**
No names of artists. Describe the *Physicality* and *Material Logic* of the UI.

**YOUR TASK:**
For EACH variation:
1. **DNA PRESERVATION:** You MUST keep the EXACT same business logic, text content, and functional structure of the Base UI. Do not remove buttons, change labels, or alter the data being displayed.
2. **VISUAL RE-SKIN:** COMPLETELY RE-IMAGINE the visual layer (CSS) using the new Style and Theme. Change colors, typography, spacing, borders, and effects while keeping the HTML structure intact.
3. Invent a unique design persona name based on a NEW physical metaphor that aligns with the requested Style and Theme.
4. Rewrite the prompt to fully adopt that metaphor's visual language.
5. Generate high-fidelity HTML/CSS. Ensure the UI matches the requested Theme (${theme}).
        `.trim();

        let buffer = '';
        await generateContentStream({
            prompt,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    variations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                html: { type: Type.STRING }
                            },
                            required: ["name", "html"]
                        }
                    }
                },
                required: ["variations"]
            },
            onChunk: (text) => {
                buffer += text;
                let braceCount = 0;
                let start = buffer.indexOf('{');
                while (start !== -1) {
                    braceCount = 0;
                    let end = -1;
                    for (let i = start; i < buffer.length; i++) {
                        if (buffer[i] === '{') braceCount++;
                        else if (buffer[i] === '}') braceCount--;
                        if (braceCount === 0 && i > start) {
                            end = i;
                            break;
                        }
                    }
                    if (end !== -1) {
                        const jsonString = buffer.substring(start, end + 1);
                        try {
                            const variation = JSON.parse(jsonString);
                            if (variation.name && variation.html) {
                                setComponentVariations(prev => {
                                    if (prev.some(v => v.name === variation.name)) return prev;
                                    return [...prev, variation];
                                });
                            } else if (variation.variations && Array.isArray(variation.variations)) {
                                variation.variations.forEach((v: any) => {
                                    if (v.name && v.html) {
                                        setComponentVariations(prev => {
                                            if (prev.some(item => item.name === v.name)) return prev;
                                            return [...prev, v];
                                        });
                                    }
                                });
                            }
                            buffer = buffer.substring(end + 1);
                            start = buffer.indexOf('{');
                        } catch (e) {
                            start = buffer.indexOf('{', start + 1);
                        }
                    } else {
                        break; 
                    }
                }
            }
        });
    } catch (e: any) {
        console.error("Error generating variations:", e);
        let errorMessage = e.message || "An unexpected error occurred.";
        if (e?.status === 429 || e?.status === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = "API Quota Exceeded. You have reached the rate limit for the Gemini API. Please try again later.";
        }
        setNotification({ message: errorMessage, type: 'error' });
    } finally {
        setIsLoading(false);
        setIsLoadingVariations(false);
    }
  }, [sessions, currentSessionIndex, focusedArtifactIndex, baseRef]);

  const applyVariation = (html: string, shouldRevise: boolean = false) => {
      if (focusedArtifactIndex === null) return;
      
      const currentSession = sessions[currentSessionIndex];
      if (!currentSession) return;

      setSessions(prev => prev.map((sess, i) => 
          i === currentSessionIndex ? {
              ...sess,
              artifacts: sess.artifacts.map((art, j) => 
                j === focusedArtifactIndex ? { ...art, html, status: 'complete' } : art
              )
          } : sess
      ));

      if (shouldRevise) {
          setBase(currentSession.id, focusedArtifactIndex);
          setInputMode('revise');
          setNotification({ message: "Variation Locked as Base. Ready for Revisions.", type: 'info' });
      }

      setDrawerState(s => ({ ...s, isOpen: false }));
      if (shouldRevise) {
          setTimeout(() => inputRef.current?.focus(), 100);
      }
  };

  const triggerLcarsConfetti = () => {
    const colors = ['#FF5F1F', '#00E5FF', '#FF00FF', '#39FF14', '#FFD700'];
    const end = Date.now() + 2 * 1000;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const commitFocusedAsBase = () => {
      const currentSession = sessions[currentSessionIndex];
      if (!currentSession || focusedArtifactIndex === null) return;
      
      const artifact = currentSession.artifacts[focusedArtifactIndex];
      if (artifact.status !== 'complete') return;

      setSessions(prev => prev.map((sess, i) => 
          i === currentSessionIndex ? { ...sess, selectedArtifactIndex: focusedArtifactIndex } : sess
      ));
      
      setBase(currentSession.id, focusedArtifactIndex);
      setInputMode('revise');
      setFocusedArtifactIndex(null);
      triggerLcarsConfetti();
      playTechSound('boot');
      setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleUndoBase = () => {
      if (drawerState.isOpen) {
          setDrawerState(s => ({...s, isOpen: false}));
          setNotification({ message: "Returning to Main Viewport.", type: 'info' });
          return;
      }
      const prevBase = undoBase();
      setNotification({ 
          message: prevBase ? "Neural State Restored." : "Neural State Reset.", 
          type: 'info' 
      });
  };

  const handleShowCode = () => {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ 
              isOpen: true, 
              mode: 'code', 
              title: 'Source Code', 
              data: artifact.html,
              artifact: artifact,
              prompt: currentSession.prompt
          });
      }
  };

  const generateRevisionSession = useCallback(async (revisionText: string) => {
      const baseSession = sessions.find(s => s.id === baseRef?.sessionId);
      const baseArtifact = baseSession?.artifacts[baseRef?.artifactIndex ?? -1];
      if (!baseSession || !baseArtifact || baseArtifact.status !== 'complete') return;

      setIsLoading(true);
      const baseTime = Date.now();
      const sessionId = generateId();

      const approaches = [
          { name: 'Refine', guidance: 'Minimal change, polish hierarchy/spacing/type/micro-interactions. Keep 95% of the base DNA.' },
          { name: 'Reimagine', guidance: 'Bolder restyle (palette/type/materiality) while keeping purpose/content/structure. Keep 70% of the base DNA.' },
          { name: 'Restructure', guidance: 'Rework layout and information hierarchy while keeping purpose/content. Keep 50% of the base DNA.' }
      ];

      const placeholderArtifacts: Artifact[] = approaches.map((app, i) => ({
          id: `${sessionId}_${i}`,
          styleName: app.name,
          html: '',
          status: 'streaming',
      }));

      const newSession: Session = {
          id: sessionId,
          kind: 'revision',
          prompt: baseSession.prompt,
          timestamp: baseTime,
          artifacts: placeholderArtifacts,
          parentSessionId: baseSession.id,
          revisionNote: revisionText,
          brief: baseSession.brief
      };

      setSessions(prev => {
          const updated = [...prev, newSession];
          return updated.length > MAX_HISTORY_SESSIONS ? updated.slice(updated.length - MAX_HISTORY_SESSIONS) : updated;
      });
      setCurrentSessionIndex(sessions.length);
      setFocusedArtifactIndex(null);

      try {
          const generateRevisionArtifact = async (artifact: Artifact, approach: {name: string, guidance: string}) => {
              try {
                  const prompt = `
You are UI/UX FLASH BY BOO. Revise an existing UI component while STRICTLY maintaining its core DNA.

BASE HTML:
<<<BASE_HTML
${baseArtifact.html}
BASE_HTML>>>

ORIGINAL UI REQUEST:
"${baseSession.prompt}"

USER REVISION INSTRUCTIONS:
"${revisionText}"

REVISION APPROACH:
"${approach.name}"
APPROACH GUIDANCE:
"${approach.guidance}"

Rules:
- **DNA INTEGRITY:** Do NOT change the core structure, logic, or content of the Base HTML unless explicitly requested by the revision instructions.
- Output ONLY HTML. No markdown or commentary.
- Complete HTML document starting with <!doctype html>.
- All CSS inside one <style> block.
- No external assets/libs, no network calls.
- Maintain a bleeding-edge tech, futuristic aesthetic.
- Contrast & Visibility: Ensure the components are not too dark. Use sufficient lightness, glowing accents, and high contrast so elements are clearly visible.

Return the revised HTML only.
                  `.trim();

                  let accumulatedHtml = '';
                  let lastUpdate = 0; // Force first update
                  await generateContentStream({
                      prompt,
                      onChunk: (text) => {
                          accumulatedHtml += text;
                          const now = Date.now();
                          if (now - lastUpdate > 100) {
                              lastUpdate = now;
                              setSessions(prev => prev.map(sess => 
                                  sess.id === sessionId ? {
                                      ...sess,
                                      artifacts: sess.artifacts.map(art => 
                                          art.id === artifact.id ? { ...art, html: accumulatedHtml } : art
                                      )
                                  } : sess
                              ));
                          }
                      }
                  });
                  
                  let finalHtml = accumulatedHtml.trim();
                  if (finalHtml.startsWith("```html")) finalHtml = finalHtml.substring(7).trimStart();
                  if (finalHtml.startsWith("```")) finalHtml = finalHtml.substring(3).trimStart();
                  if (finalHtml.endsWith("```")) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();

                  setSessions(prev => prev.map(sess => 
                      sess.id === sessionId ? {
                          ...sess,
                          artifacts: sess.artifacts.map(art => 
                              art.id === artifact.id ? { ...art, html: finalHtml, status: finalHtml ? 'complete' : 'error' } : art
                          )
                      } : sess
                  ));

              } catch (e: any) {
                  console.error('Error generating revision artifact:', e);
                  let errorMessage = e.message || "An unexpected error occurred.";
                  if (e?.status === 429 || e?.status === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                      errorMessage = "API Quota Exceeded. You have reached the rate limit for the Gemini API. Please try again later.";
                      setNotification({ message: errorMessage, type: 'error' });
                  }
                  setSessions(prev => prev.map(sess => 
                      sess.id === sessionId ? {
                          ...sess,
                          artifacts: sess.artifacts.map(art => 
                              art.id === artifact.id ? { ...art, html: `<div style="color: #ff6b6b; padding: 20px; font-family: monospace;">Error: ${errorMessage}</div>`, status: 'error' } : art
                          )
                      } : sess
                  ));
              }
          };

          await Promise.all(placeholderArtifacts.map((art, i) => generateRevisionArtifact(art, approaches[i])));

      } catch (e: any) {
          console.error("Fatal error in revision process", e);
          let errorMessage = e.message || "An unexpected error occurred.";
          if (e?.status === 429 || e?.status === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
              errorMessage = "API Quota Exceeded. You have reached the rate limit for the Gemini API. Please try again later.";
          }
          setNotification({ message: errorMessage, type: 'error' });
      } finally {
          setIsLoading(false);
          setTimeout(() => inputRef.current?.focus(), 100);
      }
  }, [baseRef, sessions]);

  const handleSendMessage = useCallback(async (manualPrompt?: string) => {
    let finalPrompt = manualPrompt || inputValue;

    const trimmedInput = finalPrompt.trim();
    
    if (!trimmedInput || isLoading) return;
    if (!manualPrompt) setInputValue('');

    playTechSound('generate');
    setIsBottomInputOpen(false); // Auto-collapse overyays
    setIsNavVisible(false);

    if (inputMode === 'revise') {
        await generateRevisionSession(trimmedInput);
        return;
    }

    setIsLoading(true);
    const baseTime = Date.now();
    const sessionId = generateId();

    const placeholderArtifacts: Artifact[] = Array(3).fill(null).map((_, i) => ({
        id: `${sessionId}_${i}`,
        styleName: 'Designing...',
        html: '',
        status: 'streaming',
    }));

    const newSession: Session = {
        id: sessionId,
        kind: 'initial',
        prompt: trimmedInput,
        timestamp: baseTime,
        artifacts: placeholderArtifacts
    };

    setSessions(prev => {
        const updated = [...prev, newSession];
        return updated.length > MAX_HISTORY_SESSIONS ? updated.slice(updated.length - MAX_HISTORY_SESSIONS) : updated;
    });
    setCurrentSessionIndex(sessions.length); 
    setFocusedArtifactIndex(null); 

    try {
        const stylePrompt = `
You are UI/UX FLASH BY BOO's Core Architect.

Create EXACTLY 3 distinct conceptual design direction NAMES for the UI request below.

Hard rules:
- STRICT IP safeguard: do NOT use brand names, product names, famous artists, studios, or trademarked style labels.
- Use high-tech, cybernetic, or futuristic material metaphors.
- Names must be 2–5 words, Title Case.
- Names must be meaningfully different from each other.

Output requirements:
- Return ONLY valid JSON.
- Return EXACTLY this shape:
{"styles":["...","...","..."]}

UI REQUEST:
"${trimmedInput}"
        `.trim();

        const styleText = await generateContent({
            prompt: stylePrompt,
            responseMimeType: "application/json"
        });

        let generatedStyles: string[] = [];
        const jsonMatch = styleText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.styles && Array.isArray(parsed.styles)) {
                    generatedStyles = parsed.styles;
                }
            } catch (e) {
                console.warn("Failed to parse styles, using fallbacks");
            }
        }

        if (!generatedStyles || generatedStyles.length < 3) {
            generatedStyles = [
                "Cybernetic Neural Grid",
                "Quantum Glass Interface",
                "Holographic Data Matrix"
            ];
        }
        
        generatedStyles = generatedStyles.slice(0, 3);

        setSessions(prev => prev.map(s => {
            if (s.id !== sessionId) return s;
            return {
                ...s,
                artifacts: s.artifacts.map((art, i) => ({
                    ...art,
                    styleName: generatedStyles[i]
                }))
            };
        }));

        const generateArtifact = async (artifact: Artifact, styleInstruction: string) => {
            try {
                const prompt = `
You are UI/UX FLASH BY BOO's Lead Engineer. Create a stunning, high-fidelity, bleeding-edge tech UI component for the request below.

UI REQUEST:
"${trimmedInput}"

CONCEPTUAL DIRECTION:
"${styleInstruction}"

VISUAL EXECUTION RULES:
1. Materiality: Use the specified conceptual direction to drive every CSS choice (e.g., shadows, borders, gradients, blend modes).
2. Typography: Use system fonts only (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif). Pair a bold sans-serif with a refined monospace for data if needed.
3. Contrast & Visibility: Ensure the components are not too dark. Use sufficient lightness, glowing accents, and high contrast so elements are clearly visible and legible.
4. Motion: Include subtle, high-performance CSS animations (hover transitions, entry reveals).
5. Layout: Be bold with negative space and hierarchy. Avoid generic cards.
6. IP SAFEGUARD: No artist names or trademarks.

TECHNICAL REQUIREMENTS:
- Return ONLY a complete HTML document starting with <!doctype html>.
- Include a self-contained <style> block in the <head>.
- Do NOT include any external assets, libraries, or network calls (no external fonts, no external CSS/JS).
- Do NOT wrap the response in markdown fences (e.g., \`\`\`html). Return raw code.
          `.trim();
          
                let accumulatedHtml = '';
                let lastUpdate = 0; // Force first update
                await generateContentStream({
                    prompt,
                    onChunk: (text) => {
                        accumulatedHtml += text;
                        const now = Date.now();
                        if (now - lastUpdate > 100) {
                            lastUpdate = now;
                            setSessions(prev => prev.map(sess => 
                                sess.id === sessionId ? {
                                    ...sess,
                                    artifacts: sess.artifacts.map(art => 
                                        art.id === artifact.id ? { ...art, html: accumulatedHtml } : art
                                    )
                                } : sess
                            ));
                        }
                    }
                });

                let finalHtml = accumulatedHtml.trim();
                if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
                if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
                if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();

                setSessions(prev => prev.map(sess => 
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art => 
                            art.id === artifact.id ? { ...art, html: finalHtml, status: finalHtml ? 'complete' : 'error' } : art
                        )
                    } : sess
                ));

            } catch (e: any) {
                console.error('Error generating artifact:', e);
                let errorMessage = e.message || "An unexpected error occurred.";
                const isQuotaError = e?.status === 429 || e?.status === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');
                if (isQuotaError) {
                    errorMessage = "API Quota Exceeded. You have reached the rate limit for the Gemini API. Please try again later.";
                    setNotification({ message: errorMessage, type: 'error' });
                }
                setSysFaults(prev => [...prev, { id: generateId(), time: new Date().toLocaleTimeString(), type: isQuotaError ? 'API Quota' : 'Generation Fault', message: errorMessage, stack: e.stack }]);
                
                setSessions(prev => prev.map(sess => 
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art => 
                            art.id === artifact.id ? { ...art, html: `<div style="color: #ff6b6b; padding: 20px; font-family: monospace;">Error: ${errorMessage}</div>`, status: 'error' } : art
                        )
                    } : sess
                ));
            }
        };

        await Promise.all(placeholderArtifacts.map((art, i) => generateArtifact(art, generatedStyles[i])));

    } catch (e: any) {
        console.error("Fatal error in generation process", e);
        let errorMessage = e.message || "An unexpected error occurred.";
        const isQuotaError = e?.status === 429 || e?.status === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');
        if (isQuotaError) {
            errorMessage = "API Quota Exceeded. You have reached the rate limit for the Gemini API. Please try again later.";
        }
        setNotification({ message: errorMessage, type: 'error' });
        setSysFaults(prev => [...prev, { id: generateId(), time: new Date().toLocaleTimeString(), type: 'Fatal Generation', message: errorMessage, stack: e.stack }]);
    } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputValue, isLoading, sessions.length, inputMode, generateRevisionSession]);

  const handleRetryArtifact = useCallback(async (sessionId: string, artifactId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;
      const artifact = session.artifacts.find(a => a.id === artifactId);
      if (!artifact || artifact.status === 'streaming') return;

      let styleName = artifact.styleName;
      if (session.kind !== 'revision' && (!styleName || styleName === 'Designing...')) {
          styleName = 'Primary Pigment Gridwork';
      }

      setSessions(prev => prev.map(s => s.id === sessionId ? {
          ...s,
          artifacts: s.artifacts.map(a => a.id === artifactId ? { ...a, status: 'streaming', html: '', styleName } : a)
      } : s));

      try {
          let prompt = '';
          if (session.kind === 'revision') {
              const baseSession = sessions.find(s => s.id === session.parentSessionId);
              let baseArtifact: Artifact | undefined;
              
              if (baseSession && typeof baseSession.selectedArtifactIndex === 'number') {
                  baseArtifact = baseSession.artifacts[baseSession.selectedArtifactIndex];
              } else if (baseRef?.sessionId === session.parentSessionId) {
                  baseArtifact = baseSession?.artifacts[baseRef.artifactIndex];
              }

              if (!baseSession || !baseArtifact || baseArtifact.status !== 'complete') {
                  throw new Error("Base version not found—select a base again.");
              }

              const approaches: Record<string, string> = {
                  'Refine': 'Minimal change, polish hierarchy/spacing/type/micro-interactions.',
                  'Reimagine': 'Bolder restyle (palette/type/materiality) while keeping purpose/content.',
                  'Restructure': 'Rework layout and information hierarchy while keeping purpose/content.'
              };
              const guidance = approaches[styleName] || approaches['Refine'];

              prompt = `
You are UI/UX FLASH BY BOO. Revise an existing UI component.

BASE HTML:
<<<BASE_HTML
${baseArtifact.html}
BASE_HTML>>>

ORIGINAL UI REQUEST:
"${baseSession.prompt}"

USER REVISION INSTRUCTIONS:
"${session.revisionNote}"

REVISION APPROACH:
"${styleName}"
APPROACH GUIDANCE:
"${guidance}"

Rules:
- Output ONLY HTML. No markdown or commentary.
- Complete HTML document starting with <!doctype html>.
- All CSS inside one <style> block.
- No external assets/libs, no network calls.
- Preserve purpose; apply the revision instructions faithfully.
- Contrast & Visibility: Ensure the components are not too dark. Use sufficient lightness, glowing accents, and high contrast so elements are clearly visible.

Return the revised HTML only.
              `.trim();
          } else {
              prompt = `
You are UI/UX FLASH BY BOO’s Lead Engineer. Create a stunning, high-fidelity UI component for the request below.

UI REQUEST:
"${session.prompt}"

CONCEPTUAL DIRECTION:
"${styleName}"

VISUAL EXECUTION RULES:
1. Materiality: Use the specified conceptual direction to drive every CSS choice (e.g., shadows, borders, gradients, blend modes).
2. Typography: Use system fonts only (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif). Pair a bold sans-serif with a refined monospace for data if needed.
3. Contrast & Visibility: Ensure the components are not too dark. Use sufficient lightness, glowing accents, and high contrast so elements are clearly visible and legible.
4. Motion: Include subtle, high-performance CSS animations (hover transitions, entry reveals).
5. Layout: Be bold with negative space and hierarchy. Avoid generic cards.
6. IP SAFEGUARD: No artist names or trademarks.

TECHNICAL REQUIREMENTS:
- Return ONLY a complete HTML document starting with <!doctype html>.
- Include a self-contained <style> block in the <head>.
- Do NOT include any external assets, libraries, or network calls (no external fonts, no external CSS/JS).
- Do NOT wrap the response in markdown fences (e.g., \`\`\`html). Return raw code.
              `.trim();
          }

          let accumulatedHtml = '';
          let lastUpdate = 0; // Force first update
          await generateContentStream({
              prompt,
              onChunk: (text) => {
                  accumulatedHtml += text;
                  const now = Date.now();
                  if (now - lastUpdate > 100) {
                      lastUpdate = now;
                      setSessions(prev => prev.map(sess => 
                          sess.id === sessionId ? {
                              ...sess,
                              artifacts: sess.artifacts.map(art => 
                                  art.id === artifactId ? { ...art, html: accumulatedHtml } : art
                              )
                          } : sess
                      ));
                  }
              }
          });
          
          let finalHtml = accumulatedHtml.trim();
          if (finalHtml.startsWith("```html")) finalHtml = finalHtml.substring(7).trimStart();
          if (finalHtml.startsWith("```")) finalHtml = finalHtml.substring(3).trimStart();
          if (finalHtml.endsWith("```")) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();

          setSessions(prev => prev.map(sess => 
              sess.id === sessionId ? {
                  ...sess,
                  artifacts: sess.artifacts.map(art => 
                      art.id === artifactId ? { ...art, html: finalHtml, status: finalHtml ? 'complete' : 'error' } : art
                  )
              } : sess
          ));

      } catch (e: any) {
          console.error('Error retrying artifact:', e);
          let errorMessage = e.message || "An unexpected error occurred.";
          if (e?.status === 429 || e?.status === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
              errorMessage = "API Quota Exceeded. You have reached the rate limit for the Gemini API. Please try again later or check your billing details.";
              setNotification({ message: errorMessage, type: 'error' });
          }
          
          setSessions(prev => prev.map(sess => 
              sess.id === sessionId ? {
                  ...sess,
                  artifacts: sess.artifacts.map(art => 
                      art.id === artifactId ? { ...art, html: `<div style="color: #ff6b6b; padding: 20px; font-family: monospace;">Error: ${errorMessage}</div>`, status: 'error' } : art
                  )
              } : sess
          ));
      }
  }, [sessions]);

  const handleExplain = useCallback(async () => {
      const currentSession = sessions[currentSessionIndex];
      if (!currentSession || focusedArtifactIndex === null) return;
      const artifact = currentSession.artifacts[focusedArtifactIndex];
      if (artifact.status !== 'complete') return;

      setDrawerState({ isOpen: true, mode: 'explain', title: 'Explain UI', data: null });
      setIsLoading(true);

      try {
          const prompt = `
You are UI/UX FLASH BY BOO's UX Explainer. Explain this UI to a beginner.

ORIGINAL REQUEST:
"${currentSession.prompt}"

${currentSession.brief ? `BRIEF:
${JSON.stringify(currentSession.brief, null, 2)}
` : ''}

HTML:
<<<HTML
${artifact.html}
HTML>>>

Return ONLY JSON matching this exact structure:
{
  "what_this_is": "1–2 sentences plain English",
  "why_it_feels_like_that": ["3 short bullets"],
  "what_to_try_next": [
    {"label":"Make it simpler","revision":"..."},
    {"label":"Make it more modern","revision":"..."},
    {"label":"Make the main button stand out","revision":"..."},
    {"label":"Add a second section","revision":"..."}
  ]
}

Rules:
- No developer jargon.
- Use human language: “big title”, “main button”, “spacing”, “contrast”.
          `.trim();

          const jsonText = await generateContent({
              prompt,
              responseMimeType: 'application/json',
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      what_this_is: { type: Type.STRING },
                      why_it_feels_like_that: { 
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                      },
                      what_to_try_next: {
                          type: Type.ARRAY,
                          items: {
                              type: Type.OBJECT,
                              properties: {
                                  label: { type: Type.STRING },
                                  revision: { type: Type.STRING }
                              },
                              required: ["label", "revision"]
                          }
                      }
                  },
                  required: ["what_this_is", "why_it_feels_like_that", "what_to_try_next"]
              }
          });
          let parsed: any = {};
          try {
              // Robust parsing: sometimes models wrap JSON in markdown blocks even with responseMimeType
              const cleanJson = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
              parsed = JSON.parse(cleanJson);
              
              // Ensure we have the required fields or show an error
              if (!parsed.what_this_is && !parsed.error) {
                  parsed = { error: "The AI returned an incomplete analysis. Please try again." };
              }
          } catch (e) {
              console.error("Failed to parse explain JSON", e);
              // Fallback if parsing fails but we have some text
              parsed = { error: "Failed to parse explanation. Please try again." };
          }
          setDrawerState(s => ({ ...s, data: parsed }));
      } catch (e: any) {
          console.error("Error explaining UI:", e);
          let errorMessage = "Failed to explain UI.";
          let eMessage = e.message || "";
          if (e?.status === 429 || e?.status === 'RESOURCE_EXHAUSTED' || eMessage.includes('429') || eMessage.includes('RESOURCE_EXHAUSTED')) {
              errorMessage = "API Quota Exceeded. You have reached the rate limit for the Gemini API. Please try again later.";
              setNotification({ message: errorMessage, type: 'error' });
          }
          setDrawerState(s => ({ ...s, data: { error: errorMessage } }));
      } finally {
          setIsLoading(false);
      }
  }, [sessions, currentSessionIndex, focusedArtifactIndex]);

  const runDiagnosticTest = useCallback(async () => {
      setTestStatus({ status: 'testing' });
      try {
          const text = await generateContent({
              prompt: "Respond with the word 'OK' if you can hear me. No other characters.",
          });
          if (text && text.toUpperCase().includes('OK')) {
              setTestStatus({ status: 'success', message: `DIAGNOSTIC PROTOCOL COMPLETED: Connection verified. Response: [${text.trim()}]` });
          } else {
              setTestStatus({ status: 'success', message: `DIAGNOSTIC COMPLETE: Response received with non-standard payload: [${text.substring(0, 100)}]` });
          }
      } catch (e: any) {
          console.error("Diagnostic test failed:", e);
          setTestStatus({ status: 'error', message: e.message || 'Unknown credential or handshake fault.' });
      }
  }, [modelSettings]);

  const handleSurpriseMe = () => {
      const currentPrompt = placeholders[placeholderIndex] || INITIAL_PLACEHOLDERS[0];
      if (!currentPrompt) {
          setNotification({ message: "No protocol available. Try again.", type: 'error' });
          return;
      }
      
      // Trigger confetti
      confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00E5FF', '#9D00FF', '#FF007F', '#FFFFFF']
      });

      setNotification({ message: "Neural Protocol Initiated...", type: 'protocol' });
      setInputValue(currentPrompt);
      handleSendMessage(currentPrompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      handleSendMessage();
    } else if (event.key === 'Tab' && !inputValue && !isLoading) {
        event.preventDefault();
        setInputValue(placeholders[placeholderIndex]);
    }
  };

  const nextItem = useCallback(() => {
      if (focusedArtifactIndex !== null) {
          if (focusedArtifactIndex < 2) setFocusedArtifactIndex(focusedArtifactIndex + 1);
      } else {
          if (currentSessionIndex < sessions.length - 1) setCurrentSessionIndex(currentSessionIndex + 1);
      }
  }, [currentSessionIndex, sessions.length, focusedArtifactIndex]);

  const prevItem = useCallback(() => {
      if (focusedArtifactIndex !== null) {
          if (focusedArtifactIndex > 0) setFocusedArtifactIndex(focusedArtifactIndex - 1);
      } else {
           if (currentSessionIndex > 0) setCurrentSessionIndex(currentSessionIndex - 1);
      }
  }, [currentSessionIndex, focusedArtifactIndex]);

  const isLoadingDrawer = isLoading && (drawerState.mode === 'variations' || drawerState.mode === 'explain') && (!drawerState.data || (drawerState.mode === 'variations' && componentVariations.length === 0));

  const hasStarted = sessions.length > 0 || isLoading;
  const currentSession = sessions[currentSessionIndex];

  let canGoBack = false;
  let canGoForward = false;

  if (hasStarted) {
      if (focusedArtifactIndex !== null) {
          canGoBack = focusedArtifactIndex > 0;
          canGoForward = focusedArtifactIndex < (currentSession?.artifacts.length || 0) - 1;
      } else {
          canGoBack = currentSessionIndex > 0;
          canGoForward = currentSessionIndex < sessions.length - 1;
      }
  }

  const isDrawerWide = drawerState.isOpen && (drawerState.mode === 'library' || drawerState.mode === 'settings' || drawerState.mode === 'history');

  return (
    <div className={`app-shell ${drawerState.isOpen ? 'detail-active' : ''} ${isDrawerWide ? 'detail-wide' : ''} ${drawerState.mode === 'variations' ? 'variations-active' : ''} ${!isNavVisible ? 'nav-hidden' : ''}`} style={{ 
        transform: `rotateY(${shellTransform.rotateY}deg) rotateX(${shellTransform.rotateX}deg)` 
    }}>
        {isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}
        {!hasStarted && <StarfieldBackground amount={2000} speed={100} />}
        <div className="nebula" />
        <div className="scan-line" />
        
        <header className="header-system" style={{ position: 'relative' }}>
            <div className="header-brand" style={{ fontFamily: 'var(--font-orbitron)', letterSpacing: '2px', fontWeight: 900, color: 'var(--quantum-cyan)' }}>QUANTUM DESIGN</div>
            
            <div className="header-bar">
                <span 
                    className="nav-trigger"
                    onClick={() => { playTechSound('click'); setIsNavVisible(!isNavVisible); }}
                    style={{ cursor: 'pointer', color: isNavVisible ? 'var(--lcars-orange)' : 'inherit' }}
                >
                    NAV ACCESS
                </span>

                <span 
                    className={`nav-trigger command-access-btn ${isBottomInputOpen ? 'active' : ''}`}
                    onClick={() => { playTechSound('click'); setIsBottomInputOpen(!isBottomInputOpen); }}
                >
                    <SparklesIcon /> COMMAND ACCESS
                </span>
                
                {baseRef && (
                    <div className="dna-base-indicator" style={{ marginLeft: '10px', color: 'var(--lume-green)', fontSize: '10px', pointerEvents: 'auto', display: 'flex', gap: '5px', alignItems: 'center' }}>
                        DNA_BASE: {sessions.find(s => s.id === baseRef.sessionId)?.artifacts[baseRef.artifactIndex]?.styleName || 'UNKNOWN'}
                        <button onClick={() => { clearBase(); playTechSound('click'); }} style={{ marginLeft: '5px', background: 'transparent', border: '1px solid var(--lume-green)', color: 'var(--lume-green)', cursor: 'pointer', borderRadius: '4px', fontSize: '8px', padding: '2px 4px' }}>CLEAR</button>
                    </div>
                )}

                {/* Persistent Action Control Keys to Prevent Dead-Ends */}
                <div className="header-bar-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '15px' }}>
                    <button 
                        className="lcars-persistent-ctrl reset"
                        onClick={() => {
                            if (confirm("WARNING: All transient records and neural buffers will be completely expunged. Proceed with system master reset?")) {
                                playTechSound('error');
                                localStorage.removeItem('alchemy_history');
                                localStorage.removeItem('alchemy_artifacts');
                                localStorage.removeItem('alchemy_folders');
                                setSessions([]);
                                setSavedArtifacts([]);
                                setFolders([]);
                                setCurrentSessionIndex(-1);
                                setFocusedArtifactIndex(null);
                                setInputValue('');
                                setInputMode('prompt');
                                setIsPortalOpen(false);
                                setDrawerState({ isOpen: false, mode: null, title: '', data: null });
                                setNotification({ message: "SYSTEM MASTER RESET COMPLETED // REBOOTING PROTOCOLS", type: 'error' });
                                setIsBooting(true);
                            }
                        }}
                        style={{
                            background: 'rgba(255, 69, 0, 0.1)',
                            border: '1px solid #FF4500',
                            color: '#FF4500',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                    >
                        ⚡ RESET SYSTEM
                    </button>
                    <button 
                        className="lcars-persistent-ctrl undo"
                        onClick={() => {
                            playTechSound('click');
                            handleUndoBase();
                        }}
                        style={{
                            background: 'rgba(255, 215, 0, 0.1)',
                            border: '1px solid #FFD700',
                            color: '#FFD700',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                    >
                        ◀ UNDO
                    </button>
                    <button 
                        className="lcars-persistent-ctrl go-back"
                        onClick={() => {
                            playTechSound('click');
                            handleCommandCenterWarp();
                        }}
                        style={{
                            background: 'rgba(0, 229, 255, 0.1)',
                            border: '1px solid #00E5FF',
                            color: '#00E5FF',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                    >
                        ⌂ GO BACK
                    </button>
                </div>
                
                <AnimatePresence>
                    {focusedArtifactIndex !== null && (
                        <motion.div 
                            className="header-artifact-options"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        >
                            <div className="lcars-divider"></div>
                            <div className="opt-item" onClick={() => { 
                                playTechSound('click'); 
                                const artifact = sessions[currentSessionIndex]?.artifacts[focusedArtifactIndex];
                                if (artifact) {
                                    setBase(sessions[currentSessionIndex].id, focusedArtifactIndex!);
                                    setNotification({ message: `DNA BASE SET: ${artifact.styleName}`, type: 'protocol' });
                                }
                            }}>DNA_v7</div>
                            <div className="opt-item" onClick={() => { 
                                playTechSound('click');
                                window.location.reload();
                            }}>EXIT/RESTART</div>
                            <div className="opt-item" onClick={() => { 
                                playTechSound('click'); 
                                handleUndoBase();
                            }}>UNDO/BACK</div>
                            <div className="opt-item" onClick={() => { 
                                playTechSound('click'); 
                                setDrawerState({ isOpen: true, mode: 'library', title: 'Data Vault', data: null });
                                setNotification({ message: "OPENING DATA VAULT...", type: 'protocol' });
                            }}>VAULT_PUSH</div>
                            <div className="opt-item" onClick={() => { playTechSound('click'); setDrawerState({ isOpen: true, mode: 'code', title: 'Source Matrix', data: currentSession?.artifacts[focusedArtifactIndex || 0]?.html || '' }); }}>SOURCE</div>
                            <div className="opt-item" onClick={() => { playTechSound('click'); }}>CLONE</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ flexGrow: 1 }}></div>

                {/* Interactive NAVIGATION Bracket with Pulse Beacon */}
                <button
                    className={`lcars-nav-trigger ${isTopMenuOpen ? 'active' : ''}`}
                    onClick={() => { playTechSound('click'); setIsTopMenuOpen(!isTopMenuOpen); }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--quantum-cyan)',
                        fontFamily: 'var(--font-orbitron)',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        padding: '4px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        position: 'relative',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}
                >
                    <span className="glowing-bracket" style={{ color: 'var(--lcars-orange)' }}>[</span>
                    <span>NAVIGATION</span>
                    <span className="glowing-bracket" style={{ color: 'var(--lcars-orange)' }}>]</span>
                    <span className="nav-pulse-beacon" style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#39FF14',
                        display: 'inline-block',
                        boxShadow: '0 0 8px #39FF14',
                        animation: 'pulse-glowing-beacon 1.5s infinite ease-in-out'
                    }}></span>
                </button>

                {/* SYSTEM SETTINGS */}
                <div 
                    className={`system-status ${drawerState.mode === 'settings' ? 'active' : ''}`} 
                    onClick={() => {
                        playTechSound('click');
                        setDrawerState(prev => (prev.isOpen && prev.mode === 'settings')
                            ? { isOpen: false, mode: null, title: '', data: null }
                            : { isOpen: true, mode: 'settings', title: 'System Settings', data: null }
                        );
                    }}
                    style={{ cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s', marginLeft: '10px' }}
                >
                    <span className="status-indicator online" style={{ background: drawerState.mode === 'settings' ? 'var(--lcars-orange)' : 'var(--lume-cyan)' }}></span>
                    <span style={{ color: drawerState.mode === 'settings' ? 'var(--lcars-orange)' : 'inherit' }}>SETTINGS</span>
                </div>
            </div>

            {/* Vertical-Wipe Navigation Dropdown Console */}
            {isTopMenuOpen && (
                <div className="lcars-dropdown-console" style={{
                    position: 'absolute',
                    top: '45px',
                    right: '20px',
                    width: '280px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid var(--quantum-cyan)',
                    borderTop: 'none',
                    boxShadow: '0 10px 30px rgba(0,229,255,0.15)',
                    zIndex: 1000,
                    padding: '15px',
                    borderRadius: '0 0 12px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    animation: 'lcars-dropdown-wipe 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--lcars-orange)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '4px', letterSpacing: '1px' }}>
                        NAV_ORCHESTRATOR // SELECT_PROTOCOL
                    </div>
                    <button
                        className="lcars-dropdown-item"
                        onClick={() => {
                            playTechSound('warp');
                            setIsTopMenuOpen(false);
                            handleCommandCenterWarp();
                        }}
                    >
                        <span className="item-indicator" style={{ background: 'var(--quantum-cyan)' }}></span>
                        <span className="item-label">COMMAND CENTER</span>
                    </button>
                    <button
                        className="lcars-dropdown-item"
                        onClick={() => {
                            playTechSound('click');
                            setIsTopMenuOpen(false);
                            setDrawerState({ isOpen: true, mode: 'library', title: 'Data Vault', data: null });
                        }}
                    >
                        <span className="item-indicator" style={{ background: 'var(--lcars-gold)' }}></span>
                        <span className="item-label">THE VAULT</span>
                    </button>
                    <button
                        className="lcars-dropdown-item"
                        onClick={() => {
                            playTechSound('click');
                            setIsTopMenuOpen(false);
                            setDrawerState({ isOpen: true, mode: 'history', title: 'Neural Logs', data: null });
                        }}
                    >
                        <span className="item-indicator" style={{ background: 'var(--lcars-orange)' }}></span>
                        <span className="item-label">HISTORY LOGS</span>
                    </button>
                    <button
                        className="lcars-dropdown-item"
                        onClick={() => {
                            playTechSound('boot');
                            setIsTopMenuOpen(false);
                            setIsPortalOpen(true);
                        }}
                    >
                        <span className="item-indicator" style={{ background: 'var(--quantum-green)' }}></span>
                        <span className="item-label">COMMUNITY PORTAL</span>
                    </button>
                </div>
            )}
        </header>

        <aside className={`nav-rail ${isNavExpanded ? 'expanded' : ''} ${isNavVisible ? 'visible' : 'hidden'}`} onMouseEnter={() => setIsNavExpanded(true)} onMouseLeave={() => setIsNavExpanded(false)}>
            <div className="nav-toggle" onClick={() => setIsNavExpanded(!isNavExpanded)}>
                <span className="nav-toggle-icon" style={{ transform: isNavExpanded ? 'rotate(-90deg)' : 'rotate(0deg)' }}>{isNavExpanded ? '▼' : '▶'}</span>
            </div>
            <div className={`nav-item ${drawerState.mode === 'history' ? 'active' : ''}`} onClick={() => { playTechSound('click'); setDrawerState(prev => (prev.isOpen && prev.mode === 'history') ? { isOpen: false, mode: null, title: '', data: null } : { isOpen: true, mode: 'history', title: 'Neural Logs', data: null }); }}>
                <span className="nav-icon">◈</span> <span className="nav-label">HISTORY</span>
            </div>
            <div className={`nav-item ${drawerState.mode === 'sound-lab' ? 'active' : ''}`} onClick={() => { playTechSound('click'); setDrawerState(prev => (prev.isOpen && prev.mode === 'sound-lab') ? { isOpen: false, mode: null, title: '', data: null } : { isOpen: true, mode: 'sound-lab', title: 'Sound Lab', data: null }); }}>
                <span className="nav-icon">◬</span> <span className="nav-label">SOUND</span>
            </div>
            <div className={`nav-item ${drawerState.mode === 'settings' ? 'active' : ''}`} onClick={() => { playTechSound('click'); setDrawerState(prev => (prev.isOpen && prev.mode === 'settings') ? { isOpen: false, mode: null, title: '', data: null } : { isOpen: true, mode: 'settings', title: 'System Settings', data: null }); }}>
                <span className="nav-icon">⚙</span> <span className="nav-label">SETTINGS</span>
            </div>
            <div style={{ flexGrow: 1 }}></div>
            <div className="nav-item" style={{ borderLeftColor: 'var(--lcars-orange)', color: 'var(--lcars-orange)' }}>
                <span className="nav-icon">⚡</span> <span className="nav-label">QUANTUM</span>
            </div>
        </aside>

        <main className="viewport">
            {drawerState.mode === 'variations' && (
                <div className="variations-container">
                    <button className="toolbar-toggle" onClick={() => document.querySelector('.variations-toolbar')?.classList.toggle('hidden')}>⫷</button>
                    <nav className="variations-toolbar hidden">
                        <div className="toolbar-top-cap">2.4 v_SYS</div>
                        <button className="nav-btn" onClick={() => { playTechSound('click'); setDrawerState(s => ({...s, isOpen: false})); }}>«</button>
                        <button className="nav-btn" onClick={() => { playTechSound('click'); setDrawerState(s => ({...s, isOpen: false})); setFocusedArtifactIndex(null); }}>⌂</button>
                        <button className="nav-btn" onClick={() => { playTechSound('click'); setDrawerState(s => ({...s, isOpen: false})); setFocusedArtifactIndex(null); }}>GRID</button>
                        <div className="toolbar-bottom-cap"></div>
                    </nav>
                    
                    <div className="sexy-container-wrapper">
                        {isLoadingVariations && componentVariations.length === 0 ? (
                            <div className="variations-loader">
                                <div className="dna-spinner">
                                    <div className="dna-dot" style={{ animationDelay: '0s' }}></div>
                                    <div className="dna-dot" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="dna-dot" style={{ animationDelay: '0.4s' }}></div>
                                    <div className="dna-dot" style={{ animationDelay: '0.6s' }}></div>
                                    <div className="dna-dot" style={{ animationDelay: '0.8s' }}></div>
                                </div>
                                <div className="lcars-header-accent-small" style={{ color: '#a855f7', marginTop: '20px' }}>SEQUENCING_VARIATIONS</div>
                            </div>
                        ) : (
                        <div className="sexy-grid">
                            {componentVariations.map((v, i) => (
                                <div key={i} className="sexy-card group" onClick={() => {
                                    playTechSound('boot');
                                    const newSession: Session = {
                                        id: generateId(),
                                        kind: 'initial',
                                        prompt: `Variation: ${v.name}`,
                                        timestamp: Date.now(),
                                        artifacts: [{
                                            id: generateId(),
                                            styleName: v.name,
                                            html: v.html,
                                            status: 'complete'
                                        }]
                                    };
                                    setSessions(prev => [...prev, newSession]);
                                    setCurrentSessionIndex(sessions.length);
                                    setFocusedArtifactIndex(0);
                                    setDrawerState(s => ({...s, isOpen: false}));
                                    setIsBottomInputOpen(false);
                                    setIsNavVisible(false);
                                }}>
                                    <div className="sexy-preview">
                                        <iframe srcDoc={v.html} title={v.name} sandbox="allow-scripts" />
                                        <div className="sexy-card-overlay">
                                            <div className="lcars-btn-inner">APPLY DNA</div>
                                        </div>
                                    </div>
                                    <div className="sexy-label lcars-label">
                                        <span>{v.name.toUpperCase()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        )}
                    </div>
                </div>
            )}

             <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`} style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                  <div className={`empty-state ${hasStarted ? 'fade-out' : ''}`}>
                      <div className="quantum-center-frame">
                          <div className="quantum-corner-accent top-right"></div>
                          <div className="quantum-corner-accent bottom-left"></div>
                          <h1 className="quantum-title">QUANTUM DESIGN</h1>
                          <p className="quantum-subtitle">QUANTUM_DYNAMICS // SYNAPSE_COMPILER_V12</p>
                          
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.8, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '15px' }}>
                              SYSTEM_ORCHESTRATOR // SYNAPTIC_COMPILE_INTERFACE
                          </p>
                          
                          <button 
                              className="surprise-button" 
                              onClick={(e) => { 
                                  e.stopPropagation(); 
                                  playTechSound('click'); 
                                  handleSurpriseMe(); 
                              }} 
                              disabled={isLoading}
                              style={{ marginTop: '20px' }}
                          >
                              <SparklesIcon /> Execute Random Protocol
                          </button>
                      </div>
                  </div>

                {sessions.map((session, sIndex) => {
                    let positionClass = 'hidden';
                    if (sIndex === currentSessionIndex) positionClass = 'active-session';
                    else if (sIndex < currentSessionIndex) positionClass = 'past-session';
                    else if (sIndex > currentSessionIndex) positionClass = 'future-session';
                    
                    return (
                        <div key={session.id} className={`session-group ${positionClass}`}>
                            <div className="artifact-grid" ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
                                {session.artifacts.map((artifact, aIndex) => {
                                    const isFocused = focusedArtifactIndex === aIndex;
                                    const isBase = baseRef?.sessionId === session.id && baseRef?.artifactIndex === aIndex;
                                    
                                    return (
                                        <ArtifactCard 
                                            key={artifact.id}
                                            artifact={artifact}
                                            isFocused={isFocused}
                                            isBase={isBase}
                                            index={aIndex}
                                            onClick={() => { playTechSound('click'); setFocusedArtifactIndex(aIndex); }}
                                            onRetry={() => { playTechSound('click'); handleRetryArtifact(session.id, artifact.id); }}
                                            onToggleFavorite={() => toggleFavorite(session.id, artifact.id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {canGoBack && (
                <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, cursor: 'pointer', opacity: 0.5 }} onClick={() => { playTechSound('click'); prevItem(); }}>
                    <ArrowLeftIcon style={{ width: '50px', height: '50px', color: 'var(--sea-foam)' }} />
                </div>
            )}
            {canGoForward && (
                <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, cursor: 'pointer', opacity: 0.5 }} onClick={() => { playTechSound('click'); nextItem(); }}>
                    <ArrowRightIcon style={{ width: '50px', height: '50px', color: 'var(--sea-foam)' }} />
                </div>
            )}

            {sysFaults.length > 0 && (
                <div 
                    style={{
                        position: 'fixed',
                        bottom: '120px', 
                        right: '20px',
                        width: '400px',
                        maxHeight: '300px',
                        background: 'rgba(20, 0, 0, 0.9)',
                        border: '1px solid #ff4444',
                        borderRadius: '12px',
                        zIndex: 9999999,
                        pointerEvents: 'auto',
                        overflowY: 'auto',
                        boxShadow: '0 0 30px rgba(255, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div style={{ padding: '12px', background: 'rgba(255, 0, 0, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', color: '#ff4444', fontSize: '14px', position: 'sticky', top: 0 }}>
                        <span>SYSTEM FAULT LOG ({sysFaults.length})</span>
                        <button onClick={() => setSysFaults([])} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px', backgroundClip: 'padding-box', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>CLEAR</button>
                    </div>
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sysFaults.map(fault => (
                            <div key={fault.id} style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#ffaaaa' }}>
                                <div style={{ color: '#ff4444', marginBottom: '4px', fontSize: '10px' }}>[{fault.time}] {fault.type}</div>
                                <div style={{ fontWeight: 'bold' }}>{fault.message}</div>
                                {fault.stack && (
                                    <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap', color: '#888', fontSize: '10px', maxHeight: '100px', overflowY: 'auto' }}>
                                        {fault.stack}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isBottomInputOpen && !isLoading && (
                <div className="bottom-input-bar active" onClick={() => inputRef.current?.focus()}>
                    <input 
                        ref={inputRef}
                        autoFocus
                        type="text" 
                        className="input-field" 
                        placeholder="COMMAND_ENTRY_PROTOCOL..."
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        style={{ pointerEvents: 'auto', userSelect: 'text', zIndex: 999999, position: 'relative' }}
                    />
                    <button className="send-btn" onClick={() => { playTechSound('click'); handleSendMessage(); }} disabled={!inputValue.trim()}>
                        EXECUTE
                    </button>
                </div>
            )}
        </main>

        <SideDrawer 
            isOpen={drawerState.isOpen} 
            onClose={() => setDrawerState(s => ({...s, isOpen: false}))} 
            title={drawerState.title}
            isWide={drawerState.mode === 'library' || drawerState.mode === 'settings' || drawerState.mode === 'history'}
        >
            {isLoadingDrawer && (
                 <div className="loading-state">
                     <ThinkingIcon /> 
                     {drawerState.mode === 'explain' ? 'Analyzing UI...' : 'Designing variations...'}
                 </div>
            )}

            {drawerState.mode === 'explain' && (
                <div className="explain-view-container">
                    {drawerState.data?.error ? (
                        <div className="error-message" style={{textAlign: 'center', padding: '40px 0'}}>{drawerState.data.error}</div>
                    ) : drawerState.data?.what_this_is ? (
                        <div className="explain-content" style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                            <div className="explain-section">
                                <h3>What this is</h3>
                                <p>{drawerState.data.what_this_is}</p>
                            </div>
                            <div className="explain-section">
                                <h3>Why it feels like that</h3>
                                <ul>
                                    {drawerState.data.why_it_feels_like_that?.map((bullet: string, i: number) => (
                                        <li key={i}>{bullet}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="explain-section">
                                <h3>What to try next</h3>
                                <div className="try-next-grid">
                                    {drawerState.data.what_to_try_next?.map((item: any, i: number) => (
                                        <button 
                                            key={i} 
                                            className="try-next-button"
                                            onClick={() => {
                                                setInputMode('revise');
                                                setInputValue(item.revision);
                                                setDrawerState(s => ({...s, isOpen: false}));
                                                setTimeout(() => inputRef.current?.focus(), 100);
                                            }}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {drawerState.mode === 'sound-lab' && (
                <div className="sound-lab-grid">
                    <button 
                        className="sound-init-btn"
                        onClick={() => { playTechSound('boot'); setNotification({ message: "Neural Audio Link Established", type: "protocol" }); }}
                    >
                        INITIALIZE AUDIO PROTOCOL
                    </button>
                    {LCARS_SOUNDS.map(sound => (
                        <div key={sound.id} className="sound-btn lcars-style" onClick={() => playPreviewSound(sound)}>
                            <div className="sound-btn-accent"></div>
                            <div className="sound-btn-content">
                                <span className="sound-id">{sound.id.toUpperCase()}</span>
                                <span className="sound-name">{sound.name}</span>
                            </div>
                            <button 
                                className="sound-download-btn"
                                onClick={(e) => { e.stopPropagation(); handleDownloadSound(sound); }}
                            >
                                DOWNLOAD
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {(drawerState.mode === 'library' || drawerState.mode === 'history') && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', pointerEvents: 'auto' }}>
                    <button 
                        onClick={() => handleDrawerTabSwitch('library', 'Data Vault')}
                        className={`lcars-btn-inner ${drawerState.mode === 'library' ? 'active' : ''}`}
                        style={{
                            flex: 1,
                            background: drawerState.mode === 'library' ? 'var(--lcars-gold, #FFD700)' : 'rgba(255, 255, 255, 0.05)',
                            color: drawerState.mode === 'library' ? '#000' : 'var(--text-secondary)',
                            fontFamily: 'var(--font-orbitron)',
                            fontWeight: 'bold',
                            padding: '8px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            letterSpacing: '1px'
                        }}
                    >
                        THE VAULT
                    </button>
                    <button 
                        onClick={() => handleDrawerTabSwitch('history', 'Neural Logs')}
                        className={`lcars-btn-inner ${drawerState.mode === 'history' ? 'active' : ''}`}
                        style={{
                            flex: 1,
                            background: drawerState.mode === 'history' ? 'var(--lcars-orange, #FF5F1F)' : 'rgba(255, 255, 255, 0.05)',
                            color: drawerState.mode === 'history' ? '#000' : 'var(--text-secondary)',
                            fontFamily: 'var(--font-orbitron)',
                            fontWeight: 'bold',
                            padding: '8px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            letterSpacing: '1px'
                        }}
                    >
                        HISTORY LOGS
                    </button>
                </div>
            )}

            {(drawerState.mode === 'library' || drawerState.mode === 'history') && (
                <div className={`drawer-flip-container ${drawerFlipActive ? 'flipped' : ''}`} style={{
                    width: '100%',
                    height: 'calc(100% - 60px)',
                    position: 'relative'
                }}>
                    {drawerState.mode === 'history' && (
                        <div className="history-container" style={{ backfaceVisibility: 'hidden', width: '100%', height: '100%' }}>
                            <div className="history-list">
                                {sessions.slice().reverse().map((session, idx) => (
                                    <div key={session.id} className="history-item" onClick={() => {
                                        playTechSound('warp');
                                        const originalIdx = sessions.length - 1 - idx;
                                        setCurrentSessionIndex(originalIdx);
                                        setFocusedArtifactIndex(0);
                                        setDrawerState(s => ({...s, isOpen: false}));
                                        setIsBottomInputOpen(false);
                                        setIsNavVisible(false);
                                    }}>
                                        <div className="history-item-header">
                                            <span className="history-date">{new Date(session.timestamp).toLocaleString()}</span>
                                            <span className="history-count">{session.artifacts.length} artifacts</span>
                                        </div>
                                        <div className="history-prompt">{session.prompt}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {drawerState.mode === 'library' && (
                        <div className="library-container" style={{ backfaceVisibility: 'hidden', width: '100%', height: '100%', display: 'flex' }}>
                            <nav className="library-folders">
                                <div className="elbow-top"></div>
                                <button 
                                    className={`nav-block ${selectedLibraryFolderId === null ? 'active active-gold' : ''}`}
                                    onClick={() => { playTechSound('click'); setSelectedLibraryFolderId(null); }}
                                >
                                    ALL.00
                                </button>
                                {folders.map((f, i) => (
                                    <button 
                                        key={f.id}
                                        className={`nav-block ${selectedLibraryFolderId === f.id ? 'active' : ''} ${i % 2 === 0 ? 'sky' : 'gold'}`}
                                        onClick={() => { playTechSound('scanning'); setSelectedLibraryFolderId(f.id); }}
                                    >
                                        {f.name.toUpperCase().slice(0, 8)}.{String(i + 1).padStart(2, '0')}
                                    </button>
                                ))}
                                <div style={{ flexGrow: 1 }}></div>
                                <button 
                                    className="nav-block gold" 
                                    style={{ height: '60px', borderRadius: '20px 0 0 40px', alignItems: 'flex-end', paddingBottom: '10px' }}
                                    onClick={() => {
                                        const name = prompt("Enter folder name:");
                                        if (name?.trim()) {
                                            const color = FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
                                            setFolders(prev => [...prev, { id: generateId(), name: name.trim(), color }]);
                                        }
                                    }}
                                >
                                    NEW_DIR
                                </button>
                            </nav>

                            <main className="library-artifacts" style={{ flex: 1, overflowY: 'auto' }}>
                                <AnimatePresence mode="wait">
                                    <motion.section 
                                        key={selectedLibraryFolderId || 'all'}
                                        initial={{ opacity: 0, x: -40, scaleX: 0.9 }}
                                        animate={{ opacity: 1, x: 0, scaleX: 1 }}
                                        exit={{ opacity: 0, x: -40, scaleX: 0.9 }}
                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                        className="vitrified-module"
                                    >
                                        <div className="scanner-line"></div>
                                        <header className="module-header">
                                            <div>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#ffcc33' }}>
                                                    VAULT // {selectedLibraryFolderId ? folders.find(f => f.id === selectedLibraryFolderId)?.name.toUpperCase() : 'ALL_DATA'}
                                                </span>
                                                <h1 className="module-title">Vitrified Storage</h1>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
                                                    {savedArtifacts.filter(art => selectedLibraryFolderId === null || art.folderId === selectedLibraryFolderId).length}
                                                </div>
                                                <div style={{ fontSize: '0.6rem', color: '#70c4ff' }}>RECORDS</div>
                                            </div>
                                        </header>

                                        <div className="sexy-grid">
                                            {savedArtifacts
                                                .filter(art => selectedLibraryFolderId === null || art.folderId === selectedLibraryFolderId)
                                                .map(art => (
                                                    <motion.div 
                                                        key={art.id} 
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="sexy-card lcars-card" 
                                                        onClick={() => {
                                                            playTechSound('boot');
                                                            const newSession: Session = {
                                                                id: generateId(),
                                                                kind: 'initial',
                                                                prompt: art.name,
                                                                timestamp: Date.now(),
                                                                artifacts: [{
                                                                    id: art.id,
                                                                    styleName: 'Loaded from Vault',
                                                                    html: art.html,
                                                                    status: 'complete',
                                                                    isFavorite: art.isFavorite
                                                                }]
                                                            };
                                                            setSessions(prev => [...prev, newSession]);
                                                            setCurrentSessionIndex(sessions.length);
                                                            setFocusedArtifactIndex(0);
                                                            setDrawerState(s => ({...s, isOpen: false}));
                                                        }}
                                                    >
                                                        <div className="sexy-preview">
                                                            <iframe srcDoc={art.html} title={art.name} sandbox="allow-scripts" />
                                                            <div className="sexy-card-overlay">
                                                                <div className="lcars-btn-inner">ACCESS</div>
                                                            </div>
                                                        </div>
                                                        <div className="sexy-label lcars-label">
                                                            <span>{art.name.toUpperCase()}</span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                        </div>
                                    </motion.section>
                                </AnimatePresence>
                            </main>
                        </div>
                    )}
                </div>
            )}

            {drawerState.mode === 'settings' && (
                <div className="quantum-settings-container">
                    <div className="settings-header-deco">
                        <div className="settings-header-title">
                            SYSTEM_ORCHESTRATOR // CONFIG_PORTAL
                        </div>
                        <div className="settings-header-status">
                            {modelSettings.activeProvider === 'vertex' ? 'SECURE_EDGE_TUNNEL' : 'LOCAL_API_HANDSHAKE'}
                        </div>
                    </div>

                    {/* Provider Select Tabs */}
                    <div className="premium-providers-hud">
                        {(['gemini', 'openai', 'claude', 'grok', 'openrouter', 'vertex'] as const).map(prov => (
                            <button
                                key={prov}
                                className={`hud-provider-btn ${prov} ${modelSettings.activeProvider === prov ? 'active' : ''}`}
                                onClick={() => {
                                    playTechSound('click');
                                    setTestStatus({ status: 'idle' });
                                    setModelSettings(prev => ({ ...prev, activeProvider: prov }));
                                }}
                            >
                                {prov === 'vertex' ? 'VERTEX AI' : prov}
                            </button>
                        ))}
                    </div>

                    <div className="cyber-settings-card">
                        {modelSettings.activeProvider === 'gemini' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">GEMINI_API_KEY</label>
                                        <span className="tactical-label-sub">CR_CREDENTIALS</span>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="PASTE_KEY_HERE..."
                                        value={modelSettings.gemini.apiKey}
                                        onChange={e => setModelSettings(prev => ({
                                            ...prev,
                                            gemini: { ...prev.gemini, apiKey: e.target.value }
                                        }))}
                                        onBlur={() => loadModelsForActiveProvider('gemini')}
                                        className="premium-cyber-input"
                                    />
                                    <small style={{ fontSize: '0.65rem', color: '#666', fontFamily: 'var(--font-mono)' }}>Falls back to environment configuration if empty.</small>
                                </div>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">TARGET_MODEL</label>
                                        <span className="tactical-label-sub">SELECT_ACTIVE</span>
                                    </div>
                                    <div className="premium-select-wrapper">
                                        <select
                                            value={modelSettings.gemini.model}
                                            onFocus={() => loadModelsForActiveProvider('gemini')}
                                            onClick={() => loadModelsForActiveProvider('gemini')}
                                            onChange={e => setModelSettings(prev => ({
                                                ...prev,
                                                gemini: { ...prev.gemini, model: e.target.value }
                                            }))}
                                            className="premium-cyber-input"
                                        >
                                            {isFetchingModels.gemini && (
                                                <option disabled>LOADING PROTOCOLS...</option>
                                            )}
                                            {((dynamicModels.gemini && dynamicModels.gemini.length > 0) ? dynamicModels.gemini : [
                                                { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash (Fast & Accurate)' },
                                                { id: 'gemini-2.5-pro', name: 'gemini-2.5-pro (Highly Capable)' },
                                                { id: 'gemini-1.5-flash', name: 'gemini-1.5-flash' },
                                                { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro' }
                                            ]).map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {modelFetchError.gemini && (
                                        <div className="model-fetch-error-alert" style={{ color: '#ff4444', fontSize: '0.7rem', marginTop: '6px', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '4px', background: 'rgba(255, 68, 68, 0.05)' }}>
                                            API ERROR: INVALID API KEY OR NETWORK FAILURE FOR GEMINI
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {modelSettings.activeProvider === 'openai' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">OPENAI_API_KEY</label>
                                        <span className="tactical-label-sub">CR_CREDENTIALS</span>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="sk-..."
                                        value={modelSettings.openai.apiKey}
                                        onChange={e => setModelSettings(prev => ({
                                            ...prev,
                                            openai: { ...prev.openai, apiKey: e.target.value }
                                        }))}
                                        onBlur={() => loadModelsForActiveProvider('openai')}
                                        className="premium-cyber-input"
                                    />
                                </div>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">TARGET_MODEL</label>
                                        <span className="tactical-label-sub">SELECT_ACTIVE</span>
                                    </div>
                                    <div className="premium-select-wrapper">
                                        <select
                                            value={modelSettings.openai.model}
                                            onFocus={() => loadModelsForActiveProvider('openai')}
                                            onClick={() => loadModelsForActiveProvider('openai')}
                                            onChange={e => setModelSettings(prev => ({
                                                ...prev,
                                                openai: { ...prev.openai, model: e.target.value }
                                            }))}
                                            className="premium-cyber-input"
                                        >
                                            {isFetchingModels.openai && (
                                                <option disabled>LOADING PROTOCOLS...</option>
                                            )}
                                            {((dynamicModels.openai && dynamicModels.openai.length > 0) ? dynamicModels.openai : [
                                                { id: 'gpt-4o-mini', name: 'gpt-4o-mini (Fast)' },
                                                { id: 'gpt-4o', name: 'gpt-4o (Powerful)' },
                                                { id: 'o1-mini', name: 'o1-mini (Reasoning)' }
                                            ]).map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {modelFetchError.openai && (
                                        <div className="model-fetch-error-alert" style={{ color: '#ff4444', fontSize: '0.7rem', marginTop: '6px', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '4px', background: 'rgba(255, 68, 68, 0.05)' }}>
                                            API ERROR: INVALID API KEY OR NETWORK FAILURE FOR OPENAI
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {modelSettings.activeProvider === 'claude' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">CLAUDE_API_KEY</label>
                                        <span className="tactical-label-sub">CR_CREDENTIALS</span>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="sk-ant-..."
                                        value={modelSettings.claude.apiKey}
                                        onChange={e => setModelSettings(prev => ({
                                            ...prev,
                                            claude: { ...prev.claude, apiKey: e.target.value }
                                        }))}
                                        onBlur={() => loadModelsForActiveProvider('claude')}
                                        className="premium-cyber-input"
                                    />
                                </div>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">TARGET_MODEL</label>
                                        <span className="tactical-label-sub">SELECT_ACTIVE</span>
                                    </div>
                                    <div className="premium-select-wrapper">
                                        <select
                                            value={modelSettings.claude.model}
                                            onFocus={() => loadModelsForActiveProvider('claude')}
                                            onClick={() => loadModelsForActiveProvider('claude')}
                                            onChange={e => setModelSettings(prev => ({
                                                ...prev,
                                                claude: { ...prev.claude, model: e.target.value }
                                            }))}
                                            className="premium-cyber-input"
                                        >
                                            {isFetchingModels.claude && (
                                                <option disabled>LOADING PROTOCOLS...</option>
                                            )}
                                            {((dynamicModels.claude && dynamicModels.claude.length > 0) ? dynamicModels.claude : [
                                                { id: 'claude-3-5-sonnet-latest', name: 'claude-3-5-sonnet-latest (Recommended)' },
                                                { id: 'claude-3-5-haiku-latest', name: 'claude-3-5-haiku-latest' },
                                                { id: 'claude-3-opus-20240229', name: 'claude-3-opus' }
                                            ]).map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {modelFetchError.claude && (
                                        <div className="model-fetch-error-alert" style={{ color: '#ff4444', fontSize: '0.7rem', marginTop: '6px', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '4px', background: 'rgba(255, 68, 68, 0.05)' }}>
                                            API ERROR: INVALID API KEY OR NETWORK FAILURE FOR CLAUDE
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {modelSettings.activeProvider === 'grok' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">GROK_API_KEY</label>
                                        <span className="tactical-label-sub">CR_CREDENTIALS</span>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="xai-..."
                                        value={modelSettings.grok.apiKey}
                                        onChange={e => setModelSettings(prev => ({
                                            ...prev,
                                            grok: { ...prev.grok, apiKey: e.target.value }
                                        }))}
                                        onBlur={() => loadModelsForActiveProvider('grok')}
                                        className="premium-cyber-input"
                                    />
                                </div>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">TARGET_MODEL</label>
                                        <span className="tactical-label-sub">SELECT_ACTIVE</span>
                                    </div>
                                    <div className="premium-select-wrapper">
                                        <select
                                            value={modelSettings.grok.model}
                                            onFocus={() => loadModelsForActiveProvider('grok')}
                                            onClick={() => loadModelsForActiveProvider('grok')}
                                            onChange={e => setModelSettings(prev => ({
                                                ...prev,
                                                grok: { ...prev.grok, model: e.target.value }
                                            }))}
                                            className="premium-cyber-input"
                                        >
                                            {isFetchingModels.grok && (
                                                <option disabled>LOADING PROTOCOLS...</option>
                                            )}
                                            {((dynamicModels.grok && dynamicModels.grok.length > 0) ? dynamicModels.grok : [
                                                { id: 'grok-2-1212', name: 'grok-2-1212' },
                                                { id: 'grok-beta', name: 'grok-beta' }
                                            ]).map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {modelFetchError.grok && (
                                        <div className="model-fetch-error-alert" style={{ color: '#ff4444', fontSize: '0.7rem', marginTop: '6px', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '4px', background: 'rgba(255, 68, 68, 0.05)' }}>
                                            API ERROR: INVALID API KEY OR NETWORK FAILURE FOR GROK
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {modelSettings.activeProvider === 'openrouter' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">OPENROUTER_API_KEY</label>
                                        <span className="tactical-label-sub">CR_CREDENTIALS</span>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="sk-or-..."
                                        value={modelSettings.openrouter.apiKey}
                                        onChange={e => setModelSettings(prev => ({
                                            ...prev,
                                            openrouter: { ...prev.openrouter, apiKey: e.target.value }
                                        }))}
                                        onBlur={() => loadModelsForActiveProvider('openrouter')}
                                        className="premium-cyber-input"
                                    />
                                </div>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">TARGET_MODEL</label>
                                        <span className="tactical-label-sub">SELECT_ACTIVE</span>
                                    </div>
                                    <div className="premium-select-wrapper">
                                        <select
                                            value={modelSettings.openrouter.model}
                                            onFocus={() => loadModelsForActiveProvider('openrouter')}
                                            onClick={() => loadModelsForActiveProvider('openrouter')}
                                            onChange={e => setModelSettings(prev => ({
                                                ...prev,
                                                openrouter: { ...prev.openrouter, model: e.target.value }
                                            }))}
                                            className="premium-cyber-input"
                                        >
                                            {isFetchingModels.openrouter && (
                                                <option disabled>LOADING PROTOCOLS...</option>
                                            )}
                                            {((dynamicModels.openrouter && dynamicModels.openrouter.length > 0) ? dynamicModels.openrouter : [
                                                { id: 'google/gemini-2.5-pro', name: 'google/gemini-2.5-pro' },
                                                { id: 'google/gemini-2.5-flash', name: 'google/gemini-2.5-flash' },
                                                { id: 'anthropic/claude-3.5-sonnet', name: 'anthropic/claude-3.5-sonnet' },
                                                { id: 'meta-llama/llama-3.3-70b-instruct', name: 'meta-llama/llama-3.3-70b-instruct' },
                                                { id: 'deepseek/deepseek-chat', name: 'deepseek/deepseek-chat' }
                                            ]).map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <small style={{ fontSize: '0.65rem', color: '#666', fontFamily: 'var(--font-mono)' }}>Fetches live models matching active credentials.</small>
                                    {modelFetchError.openrouter && (
                                        <div className="model-fetch-error-alert" style={{ color: '#ff4444', fontSize: '0.7rem', marginTop: '6px', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '4px', background: 'rgba(255, 68, 68, 0.05)' }}>
                                            API ERROR: INVALID API KEY OR NETWORK FAILURE FOR OPENROUTER
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {modelSettings.activeProvider === 'vertex' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {!modelSettings.vertex.serviceAccountJson ? (
                                    <div style={{
                                        background: 'rgba(0, 229, 255, 0.03)',
                                        border: '1px solid rgba(0, 229, 255, 0.15)',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        textAlign: 'center',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 15px rgba(0, 229, 255, 0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            background: 'rgba(0, 255, 136, 0.08)',
                                            border: '1px solid rgba(0, 255, 136, 0.3)',
                                            borderRadius: '50px',
                                            padding: '6px 16px',
                                            boxShadow: '0 0 15px rgba(0, 255, 136, 0.1)'
                                        }}>
                                            <span style={{
                                                width: '10px',
                                                height: '10px',
                                                backgroundColor: '#00ff88',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                boxShadow: '0 0 10px #00ff88, 0 0 20px #00ff88',
                                                animation: 'pulse-glowing-beacon 1.5s infinite ease-in-out'
                                            }} />
                                            <span style={{
                                                fontSize: '0.72rem',
                                                fontFamily: 'var(--font-orbitron)',
                                                fontWeight: 'bold',
                                                letterSpacing: '1px',
                                                color: '#00ff88',
                                                textShadow: '0 0 8px rgba(0,255,136,0.3)'
                                            }}>
                                                SERVER-SIDE SECURE CLOUD COMPUTE TUNNEL ACTIVE
                                            </span>
                                        </div>
                                        
                                        <p style={{
                                            fontSize: '0.7rem',
                                            lineHeight: '1.4',
                                            color: '#aaa',
                                            fontFamily: 'var(--font-mono)',
                                            margin: '0 10px',
                                            maxWidth: '380px'
                                        }}>
                                            All downstream Vertex AI protocol handshakes utilize the pre-encrypted server-side keys configured directly within the deployment environment (`VERTEX_SERVICE_ACCOUNT_JSON`). Your private credentials remain completely invisible to the client.
                                        </p>

                                        <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.2), transparent)', margin: '4px 0' }} />

                                        <button
                                            onClick={() => {
                                                playTechSound('click');
                                                setShowVertexOverride(!showVertexOverride);
                                            }}
                                            style={{
                                                background: 'rgba(255, 153, 0, 0.05)',
                                                border: '1px dashed rgba(255, 153, 0, 0.3)',
                                                borderRadius: '4px',
                                                padding: '8px 12px',
                                                color: 'var(--lcars-orange)',
                                                fontFamily: 'var(--font-orbitron)',
                                                fontSize: '0.65rem',
                                                fontWeight: 'bold',
                                                letterSpacing: '1px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                textShadow: '0 0 5px rgba(255, 153, 0, 0.2)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255, 153, 0, 0.1)';
                                                e.currentTarget.style.borderColor = 'var(--lcars-orange)';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 153, 0, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255, 153, 0, 0.05)';
                                                e.currentTarget.style.borderColor = 'rgba(255, 153, 0, 0.3)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {showVertexOverride ? '[ COLLAPSE LOCAL CREDENTIAL OVERRIDE PROTOCOL ]' : '[ EXPAND LOCAL CREDENTIAL OVERRIDE PROTOCOL ]'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: 'rgba(255, 153, 0, 0.02)',
                                        border: '1px dashed rgba(255, 153, 0, 0.25)',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        alignItems: 'center',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            background: 'rgba(255, 153, 0, 0.08)',
                                            border: '1px solid rgba(255, 153, 0, 0.4)',
                                            borderRadius: '50px',
                                            padding: '6px 16px',
                                            boxShadow: '0 0 15px rgba(255, 153, 0, 0.1)'
                                        }}>
                                            <span style={{
                                                width: '10px',
                                                height: '10px',
                                                backgroundColor: 'var(--lcars-orange)',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                boxShadow: '0 0 10px var(--lcars-orange), 0 0 20px var(--lcars-orange)',
                                                animation: 'pulse-glowing-beacon 1.5s infinite ease-in-out'
                                            }} />
                                            <span style={{
                                                fontSize: '0.72rem',
                                                fontFamily: 'var(--font-orbitron)',
                                                fontWeight: 'bold',
                                                letterSpacing: '1px',
                                                color: 'var(--lcars-orange)',
                                                textShadow: '0 0 8px rgba(255, 153, 0, 0.3)'
                                            }}>
                                                LOCAL CREDENTIAL OVERRIDE PROTOCOL ACTIVE
                                            </span>
                                        </div>
                                        
                                        <p style={{
                                            fontSize: '0.7rem',
                                            lineHeight: '1.4',
                                            color: '#aaa',
                                            fontFamily: 'var(--font-mono)',
                                            margin: '0 10px',
                                            maxWidth: '380px'
                                        }}>
                                            The application is bypassing the secure server-side key store in favor of your client-side Service Account override. You may edit or purge these keys below.
                                        </p>

                                        <button
                                            onClick={() => {
                                                playTechSound('click');
                                                setModelSettings(prev => ({
                                                    ...prev,
                                                    vertex: { ...prev.vertex, serviceAccountJson: '' }
                                                }));
                                                setNotification({ message: "LOCAL CREDENTIALS PURGED. SECURE TUNNEL ACTIVE.", type: "protocol" });
                                            }}
                                            style={{
                                                background: 'rgba(255, 68, 68, 0.08)',
                                                border: '1px solid rgba(255, 68, 68, 0.4)',
                                                borderRadius: '4px',
                                                padding: '8px 12px',
                                                color: '#ff4444',
                                                fontFamily: 'var(--font-orbitron)',
                                                fontSize: '0.65rem',
                                                fontWeight: 'bold',
                                                letterSpacing: '1px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                textShadow: '0 0 5px rgba(255, 68, 68, 0.2)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.15)';
                                                e.currentTarget.style.borderColor = '#ff4444';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.08)';
                                                e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.4)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            [ PURGE LOCAL OVERRIDE & REVERT TO SECURE TUNNEL ]
                                        </button>
                                    </div>
                                )}

                                {(!modelSettings.vertex.serviceAccountJson ? showVertexOverride : true) && (
                                    <div className="tactical-field-group">
                                        <div className="tactical-label-row">
                                            <label className="tactical-label">SERVICE_ACCOUNT_JSON</label>
                                            <span className="tactical-label-sub">CRED_LOADER</span>
                                        </div>
                                        
                                        {/* Google Cloud Service Account Drag & Drop Zone */}
                                        <div
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                                            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove('dragover');
                                                const file = e.dataTransfer.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        try {
                                                            const json = JSON.parse(event.target?.result as string);
                                                            setModelSettings(prev => ({
                                                                ...prev,
                                                                vertex: { ...prev.vertex, serviceAccountJson: JSON.stringify(json, null, 2) }
                                                            }));
                                                            setNotification({ message: "SERVICE_ACCOUNT JSON LOADED SUCCESS", type: "protocol" });
                                                        } catch (err) {
                                                            setNotification({ message: "INVALID SERVICE_ACCOUNT JSON PAYLOAD", type: "error" });
                                                        }
                                                    };
                                                    reader.readAsText(file);
                                                }
                                            }}
                                            className="datacore-upload-panel"
                                        >
                                            <span className="datacore-upload-icon">⎗</span>
                                            <span className="datacore-upload-text">
                                                DRAG & DROP SERVICE_ACCOUNT.json HERE
                                            </span>
                                            <span className="datacore-upload-subtext">
                                                FOR CLOUD COMPUTE HANDSHAKE
                                            </span>
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            try {
                                                                const json = JSON.parse(event.target?.result as string);
                                                                setModelSettings(prev => ({
                                                                    ...prev,
                                                                    vertex: { ...prev.vertex, serviceAccountJson: JSON.stringify(json, null, 2) }
                                                                }));
                                                                setNotification({ message: "SERVICE_ACCOUNT JSON LOADED SUCCESS", type: "protocol" });
                                                            } catch (err) {
                                                                setNotification({ message: "INVALID SERVICE_ACCOUNT JSON PAYLOAD", type: "error" });
                                                            }
                                                        };
                                                        reader.readAsText(file);
                                                    }
                                                }}
                                                style={{ display: 'none' }}
                                                id="sa-json-upload"
                                            />
                                            <label htmlFor="sa-json-upload" style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.7rem', color: 'var(--lume-cyan)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>
                                                OR BROWSE SYSTEM DIRECTORY
                                            </label>
                                        </div>

                                        <textarea
                                            rows={6}
                                            placeholder='{ "type": "service_account", "project_id": ... }'
                                            value={modelSettings.vertex.serviceAccountJson}
                                            onChange={e => setModelSettings(prev => ({
                                                ...prev,
                                                vertex: { ...prev.vertex, serviceAccountJson: e.target.value }
                                            }))}
                                            onBlur={() => loadModelsForActiveProvider('vertex')}
                                            className="cyber-terminal-textarea"
                                        />
                                        <small style={{ fontSize: '0.65rem', color: '#666', fontFamily: 'var(--font-mono)' }}>Paste your complete Google Cloud service account key JSON file contents securely. Checked locally in browser via RS256.</small>
                                    </div>
                                )}
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">GCP_REGION</label>
                                        <span className="tactical-label-sub">ZONE_SECTOR</span>
                                    </div>
                                    <div className="premium-select-wrapper">
                                        <select
                                            value={modelSettings.vertex.region}
                                            onChange={e => setModelSettings(prev => ({
                                                ...prev,
                                                vertex: { ...prev.vertex, region: e.target.value }
                                            }))}
                                            className="premium-cyber-input"
                                        >
                                            <option value="us-central1">us-central1 (Iowa)</option>
                                            <option value="us-east4">us-east4 (N. Virginia)</option>
                                            <option value="europe-west1">europe-west1 (Belgium)</option>
                                            <option value="asia-northeast1">asia-northeast1 (Tokyo)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="tactical-field-group">
                                    <div className="tactical-label-row">
                                        <label className="tactical-label">TARGET_MODEL</label>
                                        <span className="tactical-label-sub">ACTIVE_ENGINE</span>
                                    </div>
                                    <div className="premium-select-wrapper">
                                        <select
                                            value={modelSettings.vertex.model}
                                            onChange={e => setModelSettings(prev => ({
                                                ...prev,
                                                vertex: { ...prev.vertex, model: e.target.value }
                                            }))}
                                            className="premium-cyber-input"
                                        >
                                            <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                            <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                                            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                                            <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                                        </select>
                                    </div>
                                    {modelFetchError.vertex && (
                                        <div className="model-fetch-error-alert" style={{ color: '#ff4444', fontSize: '0.7rem', marginTop: '6px', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '4px', background: 'rgba(255, 68, 68, 0.05)' }}>
                                            API ERROR: INVALID CREDENTIALS OR NETWORK FAILURE FOR VERTEX
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Diagnostic Test area */}
                    <div style={{ marginTop: '20px' }}>
                        <button
                            className="premium-diagnostic-btn"
                            onClick={() => { playTechSound('click'); runDiagnosticTest(); }}
                            disabled={testStatus.status === 'testing'}
                        >
                            <span>⚡</span> {testStatus.status === 'testing' ? 'RUNNING_DIAGNOSTIC...' : 'TEST_CONNECTION_PROTOCOL'}
                        </button>

                        {testStatus.status !== 'idle' && (
                            <div className="premium-diagnostic-status-box" style={{
                                background: testStatus.status === 'testing' ? 'rgba(255, 255, 255, 0.02)' : testStatus.status === 'success' ? 'rgba(57, 255, 20, 0.04)' : 'rgba(255, 68, 68, 0.04)',
                                borderColor: testStatus.status === 'testing' ? 'rgba(255,255,255,0.15)' : testStatus.status === 'success' ? 'rgba(57, 255, 20, 0.25)' : 'rgba(255, 68, 68, 0.25)',
                                color: testStatus.status === 'testing' ? 'var(--text-secondary)' : testStatus.status === 'success' ? '#39FF14' : '#ff4444',
                            }}>
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', textTransform: 'uppercase', color: testStatus.status === 'testing' ? '#fff' : testStatus.status === 'success' ? '#39FF14' : '#ff4444' }}>
                                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: testStatus.status === 'testing' ? '#fff' : testStatus.status === 'success' ? '#39FF14' : '#ff4444', boxShadow: `0 0 6px ${testStatus.status === 'testing' ? '#fff' : testStatus.status === 'success' ? '#39FF14' : '#ff4444'}` }} />
                                    STATUS: {testStatus.status}
                                </div>
                                <div style={{ opacity: 0.85, fontSize: '0.7rem', lineHeight: '1.4' }}>{testStatus.message || 'Initializing connection protocol handshake...'}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </SideDrawer>

        <footer className={`system-footer ${isBottomInputOpen ? 'visible' : 'hidden'}`}>
            <div className="footer-block">LOG: QUANTUM DESIGN // SYNAPSE_COMPILER_V12 // TRANSLUCENCY ENGINE: MAX // BACKGROUND_VISIBLE: TRUE</div>
            <div className="footer-block meta">LOC: 44.02.11 // OFFSET: 0.0009 // <span style={{ marginLeft: '10px' }}>NEON_ACTIVE</span></div>
        </footer>

        {/* WIDESCREEN COMMUNITY PORTAL MODAL */}
        {isPortalOpen && (
            <div className="portal-modal-overlay" style={{ zIndex: 10000 }}>
                <div className="portal-modal-window">
                    <header className="portal-header">
                        <div className="portal-header-left">
                            <h2>QUANTUM DESIGN // COMMUNITY_REPOSITORIES</h2>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--lcars-orange)' }}>SYNAPTIC_CATALOG // COMPILER_v12</span>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div className="portal-view-toggle" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <button 
                                    className={`lcars-btn-inner ${portalViewMode === 'carousel' ? 'active' : ''}`}
                                    onClick={() => { playTechSound('click'); setPortalViewMode('carousel'); }}
                                    style={{ padding: '6px 12px', fontSize: '0.7rem', border: 'none', borderRadius: '4px', cursor: 'pointer', background: portalViewMode === 'carousel' ? 'var(--quantum-cyan)' : 'transparent', color: portalViewMode === 'carousel' ? '#000' : 'var(--text-secondary)', fontFamily: 'var(--font-orbitron)', fontWeight: 'bold' }}
                                >
                                    CAROUSEL VIEW
                                </button>
                                <button 
                                    className={`lcars-btn-inner ${portalViewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => { playTechSound('click'); setPortalViewMode('grid'); }}
                                    style={{ padding: '6px 12px', fontSize: '0.7rem', border: 'none', borderRadius: '4px', cursor: 'pointer', background: portalViewMode === 'grid' ? 'var(--quantum-cyan)' : 'transparent', color: portalViewMode === 'grid' ? '#000' : 'var(--text-secondary)', fontFamily: 'var(--font-orbitron)', fontWeight: 'bold' }}
                                >
                                    GRID VIEW
                                </button>
                            </div>

                            {portalViewMode === 'grid' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>GRID DENSITY:</span>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="3" 
                                        value={portalGridDensity} 
                                        onChange={(e) => { playTechSound('click'); setPortalGridDensity(Number(e.target.value)); }}
                                        style={{ accentColor: 'var(--quantum-cyan)', width: '80px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '0.7rem', color: 'var(--quantum-cyan)', fontFamily: 'var(--font-mono)', minWidth: '45px' }}>
                                        {portalGridDensity === 1 ? 'COMPACT' : portalGridDensity === 2 ? 'STANDARD' : 'DETAILED'}
                                    </span>
                                </div>
                            )}

                            <button 
                                className="close-detail" 
                                onClick={() => { playTechSound('click'); setIsPortalOpen(false); }} 
                                style={{ position: 'relative', top: 'auto', right: 'auto', background: 'var(--lcars-orange)', color: '#000', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', border: 'none' }}
                            >
                                ✕
                            </button>
                        </div>
                    </header>

                    <div className="portal-body">
                        {/* LEFT SIDEBAR - COMPONENT CATEGORY PANEL */}
                        <aside className="portal-sidebar">
                            <div className="portal-search-wrapper">
                                <input 
                                    className="portal-search-input"
                                    type="text" 
                                    placeholder="Search categories..."
                                    value={portalSearch}
                                    onChange={(e) => setPortalSearch(e.target.value)}
                                />
                            </div>

                            <div className="portal-categories-list">
                                {/* Discover group */}
                                <div className="portal-category-group">Discover</div>
                                {PORTAL_CATEGORIES.filter(cat => cat.group === 'Discover' && cat.name.toLowerCase().includes(portalSearch.toLowerCase())).map(cat => (
                                    <div 
                                        key={cat.id} 
                                        className={`portal-cat-item ${portalCategory === cat.id ? 'active' : ''}`}
                                        onClick={() => { playTechSound('scanning'); setPortalCategory(cat.id); }}
                                    >
                                        <span>{cat.name}</span>
                                        <span className="portal-cat-count">{cat.count}</span>
                                    </div>
                                ))}

                                {/* Components group with filter categories under */}
                                <div className="portal-category-group" style={{ marginTop: '15px' }}>Components</div>
                                {PORTAL_CATEGORIES.filter(cat => cat.group === 'Components' && cat.name.toLowerCase().includes(portalSearch.toLowerCase())).map(cat => (
                                    <div 
                                        key={cat.id} 
                                        className={`portal-cat-item ${portalCategory === cat.id ? 'active' : ''}`}
                                        onClick={() => { playTechSound('scanning'); setPortalCategory(cat.id); }}
                                    >
                                        <span>{cat.name}</span>
                                        <span className="portal-cat-count">{cat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* MAIN STAGE */}
                        <main className="portal-main-stage" style={{ overflowY: 'auto', padding: '20px' }}>
                            {(() => {
                                const filteredDesigns = COMMUNITY_DESIGNS.filter(d => 
                                    portalCategory === 'all' || 
                                    d.category === portalCategory || 
                                    (portalCategory === 'popular' && d.bookmarks > 100)
                                );
                                const activeDesignsCount = filteredDesigns.length;

                                if (activeDesignsCount === 0) {
                                    return (
                                        <div className="portal-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', padding: '40px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(0, 229, 255, 0.2)', borderRadius: '12px', textAlign: 'center', backdropFilter: 'blur(10px)', margin: '20px' }}>
                                            <div style={{ fontSize: '3rem', color: 'var(--lcars-orange, #FF5F1F)', marginBottom: '15px' }}>⚠️</div>
                                            <h3 style={{ fontFamily: 'var(--font-orbitron)', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', margin: '0 0 10px 0', fontSize: '1.2rem' }}>
                                                [!] NO COMPILED SEGMENTS FOUND IN THIS QUADRANT
                                            </h3>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '450px', lineHeight: '1.5', margin: '0 0 20px 0', fontFamily: 'var(--font-mono)' }}>
                                                No designs have been cataloged under "{PORTAL_CATEGORIES.find(c => c.id === portalCategory)?.name || portalCategory}". Click below to generate this component type instantly!
                                            </p>
                                            <button 
                                                className="surprise-button"
                                                onClick={() => {
                                                    const seedPrompt = `Generate a futuristic, high-fidelity ${PORTAL_CATEGORIES.find(c => c.id === portalCategory)?.name || portalCategory} component with Orbitron typography and premium glassmorphism effects.`;
                                                    playTechSound('generate');
                                                    setIsPortalOpen(false);
                                                    setInputValue(seedPrompt);
                                                    setInputMode('prompt');
                                                    handleSendMessage(seedPrompt);
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--quantum-cyan)', color: '#000', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-orbitron)', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                            >
                                                SYNTHESIZE NEW MODULE
                                            </button>
                                        </div>
                                    );
                                }

                                return portalViewMode === 'carousel' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                        {PORTAL_CATEGORIES.filter(cat => cat.group === 'Components' && (portalCategory === 'all' || portalCategory === cat.id || (portalCategory === 'popular' && cat.count > 0))).map(cat => {
                                            const laneDesigns = COMMUNITY_DESIGNS.filter(d => d.category === cat.id && (portalCategory !== 'popular' || d.bookmarks > 100));
                                            if (laneDesigns.length === 0) return null;
                                            return (
                                                <div className="portal-lane" key={cat.id} style={{ position: 'relative' }}>
                                                    <header className="portal-lane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <h3 className="portal-lane-title" style={{ margin: 0, fontFamily: 'var(--font-orbitron)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem', color: 'var(--quantum-cyan)' }}>{cat.name}</h3>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>VIEW_ALL ({laneDesigns.length})</span>
                                                    </header>

                                                    {/* Horizontal Carousel Lanes with Turquoise Glowing Nav Chevrons */}
                                                    <div className="portal-lane-carousel-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                        <button 
                                                            className="pulsing-chevron left"
                                                            onClick={(e) => {
                                                                playTechSound('click');
                                                                const container = e.currentTarget.nextSibling as HTMLDivElement;
                                                                if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
                                                            }}
                                                            style={{ position: 'absolute', left: '-15px', zIndex: 10, background: 'rgba(0,0,0,0.8)', border: '1px solid var(--quantum-cyan)', color: 'var(--quantum-cyan)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 10px var(--quantum-cyan-glow)' }}
                                                        >
                                                            ‹
                                                        </button>
                                                        <div className="portal-lane-carousel" style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '5px', width: '100%', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                            {laneDesigns.map(design => (
                                                                <div className="portal-card" key={design.id} style={{ flexShrink: 0, width: '260px' }}>
                                                                    <div className="portal-card-preview" style={{ height: '150px', background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                                                                        <iframe srcDoc={design.html} title={design.name} sandbox="allow-scripts" style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} />
                                                                        <div className="portal-card-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                                                            <button 
                                                                                className="portal-card-btn primary"
                                                                                onClick={() => {
                                                                                    playTechSound('click');
                                                                                    navigator.clipboard.writeText(design.html);
                                                                                    setNotification({ message: "HTML CODE STREAM COPIED TO BUFFER", type: 'protocol' });
                                                                                }}
                                                                                style={{ padding: '6px 12px', fontSize: '0.7rem', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'var(--quantum-cyan)', color: '#000', fontWeight: 'bold' }}
                                                                            >
                                                                                COPY CODE
                                                                            </button>
                                                                            <button 
                                                                                className="portal-card-btn secondary"
                                                                                onClick={() => {
                                                                                    playTechSound('warp');
                                                                                    const newSession: Session = {
                                                                                        id: generateId(),
                                                                                        kind: 'initial',
                                                                                        prompt: design.name,
                                                                                        timestamp: Date.now(),
                                                                                        artifacts: [{
                                                                                            id: design.id,
                                                                                            styleName: design.name,
                                                                                            html: design.html,
                                                                                            status: 'complete',
                                                                                            isFavorite: false
                                                                                        }]
                                                                                    };
                                                                                    setSessions(prev => [...prev, newSession]);
                                                                                    setCurrentSessionIndex(sessions.length);
                                                                                    setFocusedArtifactIndex(0);
                                                                                    setIsPortalOpen(false);
                                                                                }}
                                                                                style={{ padding: '6px 12px', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                                                                            >
                                                                                LOAD WORKSPACE
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="portal-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                                        <div className="portal-card-title" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{design.name}</div>
                                                                        <div className="portal-card-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                            <button 
                                                                                className={`bookmark-btn ${bookmarkedDesigns[design.id] ? 'active' : ''}`}
                                                                                onClick={() => handleBookmarkDesign(design)}
                                                                                style={{ background: 'transparent', border: 'none', color: bookmarkedDesigns[design.id] ? 'var(--quantum-gold)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem' }}
                                                                            >
                                                                                ★
                                                                            </button>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                                                                    {privateDesigns[design.id] ? 'PRIV' : 'PUB'}
                                                                                </span>
                                                                                <label className="portal-sliding-switch" style={{ position: 'relative', display: 'inline-block', width: '26px', height: '14px' }}>
                                                                                    <input 
                                                                                        type="checkbox" 
                                                                                        checked={!!privateDesigns[design.id]} 
                                                                                        onChange={() => {
                                                                                            playTechSound('click');
                                                                                            setPrivateDesigns(prev => ({ ...prev, [design.id]: !prev[design.id] }));
                                                                                        }}
                                                                                        style={{ opacity: 0, width: 0, height: 0 }}
                                                                                    />
                                                                                    <span className="slider" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, background: privateDesigns[design.id] ? 'var(--lcars-orange)' : 'var(--lume-cyan)', borderRadius: '34px', transition: '0.4s' }}>
                                                                                        <span className="slider-knob" style={{ position: 'absolute', content: '""', height: '8px', width: '8px', left: privateDesigns[design.id] ? '14px' : '4px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.4s' }}></span>
                                                                                    </span>
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button 
                                                            className="pulsing-chevron right"
                                                            onClick={(e) => {
                                                                playTechSound('click');
                                                                const container = e.currentTarget.previousSibling as HTMLDivElement;
                                                                if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
                                                            }}
                                                            style={{ position: 'absolute', right: '-15px', zIndex: 10, background: 'rgba(0,0,0,0.8)', border: '1px solid var(--quantum-cyan)', color: 'var(--quantum-cyan)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 10px var(--quantum-cyan-glow)' }}
                                                        >
                                                            ›
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    /* GRID VIEW STAGE */
                                    <div className={`portal-grid-stage ${portalGridDensity === 1 ? 'grid-compact' : portalGridDensity === 2 ? 'grid-standard' : 'grid-detailed'}`} style={{ display: 'grid', gap: '20px', gridTemplateColumns: portalGridDensity === 1 ? 'repeat(4, 1fr)' : portalGridDensity === 2 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)' }}>
                                        {filteredDesigns.map(design => (
                                            <div className="portal-card" key={design.id}>
                                                <div className="portal-card-preview" style={{ height: portalGridDensity === 1 ? '110px' : portalGridDensity === 2 ? '150px' : '220px', background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                                                    <iframe srcDoc={design.html} title={design.name} sandbox="allow-scripts" style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} />
                                                    <div className="portal-card-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                                        <button 
                                                            className="portal-card-btn primary"
                                                            onClick={() => {
                                                                playTechSound('click');
                                                                navigator.clipboard.writeText(design.html);
                                                                setNotification({ message: "HTML CODE STREAM COPIED TO BUFFER", type: 'protocol' });
                                                            }}
                                                            style={{ padding: '6px 12px', fontSize: '0.7rem', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'var(--quantum-cyan)', color: '#000', fontWeight: 'bold' }}
                                                        >
                                                            COPY CODE
                                                        </button>
                                                        <button 
                                                            className="portal-card-btn secondary"
                                                            onClick={() => {
                                                                playTechSound('warp');
                                                                const newSession: Session = {
                                                                    id: generateId(),
                                                                    kind: 'initial',
                                                                    prompt: design.name,
                                                                    timestamp: Date.now(),
                                                                    artifacts: [{
                                                                        id: design.id,
                                                                        styleName: design.name,
                                                                        html: design.html,
                                                                        status: 'complete',
                                                                        isFavorite: false
                                                                    }]
                                                                };
                                                                setSessions(prev => [...prev, newSession]);
                                                                setCurrentSessionIndex(sessions.length);
                                                                setFocusedArtifactIndex(0);
                                                                setIsPortalOpen(false);
                                                            }}
                                                            style={{ padding: '6px 12px', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                                                        >
                                                            LOAD WORKSPACE
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="portal-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                    <div className="portal-card-title" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{design.name}</div>
                                                    <div className="portal-card-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <button 
                                                            className={`bookmark-btn ${bookmarkedDesigns[design.id] ? 'active' : ''}`}
                                                            onClick={() => handleBookmarkDesign(design)}
                                                            style={{ background: 'transparent', border: 'none', color: bookmarkedDesigns[design.id] ? 'var(--quantum-gold)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem' }}
                                                        >
                                                            ★
                                                        </button>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                                                {privateDesigns[design.id] ? 'PRIV' : 'PUB'}
                                                            </span>
                                                            <label className="portal-sliding-switch" style={{ position: 'relative', display: 'inline-block', width: '26px', height: '14px' }}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={!!privateDesigns[design.id]} 
                                                                    onChange={() => {
                                                                        playTechSound('click');
                                                                        setPrivateDesigns(prev => ({ ...prev, [design.id]: !prev[design.id] }));
                                                                    }}
                                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                                />
                                                                <span className="slider" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, background: privateDesigns[design.id] ? 'var(--lcars-orange)' : 'var(--lume-cyan)', borderRadius: '34px', transition: '0.4s' }}>
                                                                    <span className="slider-knob" style={{ position: 'absolute', content: '""', height: '8px', width: '8px', left: privateDesigns[design.id] ? '14px' : '4px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.4s' }}></span>
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </main>
                    </div>
                </div>
            </div>
        )}

        <StarfieldBackground 
            amount={starfieldAmount}
            speed={starfieldSpeed}
            maxDepth={1000}
            maxSize={2}
            followMouse={true}
        />

        {notification && (
            <div className={`global-error-toast type-${notification.type}`} onClick={() => setNotification(null)} style={{ zIndex: 1000 }}>
                <div className="error-content">
                    {notification.type === 'protocol' && <SparklesIcon />}
                    <span>{notification.message}</span>
                </div>
                <button className="close-error" onClick={() => setNotification(null)}>×</button>
            </div>
        )}

        {isVariationsModalOpen && (
            <div className="modal-overlay" style={{ zIndex: 2000 }}>
                <div className="modal-content variations-modal lcars-modal">
                    <div className="lcars-header-accent-small" style={{ marginBottom: '20px' }}>VARIATION_PARAMETERS</div>
                    
                    <div className="form-group">
                        <label className="lcars-label">STYLE_PROFILE</label>
                        <select value={variationStyle} onChange={e => setVariationStyle(e.target.value)} className="lcars-input">
                            <option value="Custom">Custom...</option>
                            {VARIATION_STYLES.map(style => (
                                <option key={style} value={style}>{style}</option>
                            ))}
                        </select>
                        {variationStyle === 'Custom' && (
                            <input 
                                type="text" 
                                placeholder="Describe your custom style..." 
                                value={customVariationStyle} 
                                onChange={e => setCustomVariationStyle(e.target.value)}
                                className="lcars-input"
                                style={{ marginTop: '10px' }}
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label className="lcars-label">THEME_OVERRIDE</label>
                        <select value={variationTheme} onChange={e => setVariationTheme(e.target.value)} className="lcars-input">
                            <option value="Custom">Custom...</option>
                            <option value="Dark">Dark</option>
                            <option value="Light">Light</option>
                            <option value="High Contrast">High Contrast</option>
                        </select>
                        {variationTheme === 'Custom' && (
                            <input 
                                type="text" 
                                placeholder="Describe your custom theme..." 
                                value={customVariationTheme} 
                                onChange={e => setCustomVariationTheme(e.target.value)}
                                className="lcars-input"
                                style={{ marginTop: '10px' }}
                            />
                        )}
                    </div>

                    <div className="modal-actions" style={{ marginTop: '30px' }}>
                        <button className="btn-secondary" onClick={() => setIsVariationsModalOpen(false)}>ABORT</button>
                        <button className="btn-primary" onClick={() => {
                            setIsVariationsModalOpen(false);
                            handleGenerateVariations(
                                variationStyle === 'Custom' ? customVariationStyle : variationStyle,
                                variationTheme === 'Custom' ? customVariationTheme : variationTheme
                            );
                        }}>INITIATE_SEQUENCE</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = (window as any)._reactRoot || ReactDOM.createRoot(rootElement);
  (window as any)._reactRoot = root;
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
