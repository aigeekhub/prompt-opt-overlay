-- Create database tables for CLAW-OPS

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    api_key_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, -- sess_xxx
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    profile TEXT NOT NULL DEFAULT 'default_fast',
    created_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY, -- job_xxx
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    profile TEXT NOT NULL,
    input_type TEXT NOT NULL, -- text, voice, file
    input_text TEXT,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, running, completed, failed, cancelled
    result_text TEXT,
    live_view_token TEXT,
    live_view_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT
);

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- job.started, agent.step, tool.called, etc.
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    size_bytes BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telegram_users (
    telegram_user_id BIGINT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT false,
    pin_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_events_job ON events(job_id);
CREATE INDEX IF NOT EXISTS idx_events_tenant ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_job ON files(job_id);

-- Seed Default Tenant
INSERT INTO tenants (id, name, api_key_hash) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Fenix Tenant', 'd6d7c1cef85ced5e37579d42162f270ad4375a429beee88cde0e007d3abc05ed') 
ON CONFLICT (id) DO NOTHING;
