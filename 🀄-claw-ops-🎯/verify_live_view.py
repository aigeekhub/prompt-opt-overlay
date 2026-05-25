import requests
import sys

BASE_URL = "http://localhost:3000"
TOKEN = "mobu_secret_token_2026_dev"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_live_view_flow():
    print("=== Test 1: Job Submission & URL Generation ===")
    payload = {
        "message": "Testing signed live view URL rendering.",
        "profile": "default_fast"
    }
    
    # 1. Submit job
    r = requests.post(f"{BASE_URL}/v1/chat", json=payload, headers=HEADERS)
    if r.status_code != 201:
        print(f"FAILED: Submit job returned {r.status_code}: {r.text}")
        return False
        
    data = r.json()
    print("Response data received:")
    print(data)
    
    if "live_view" not in data:
        print("FAILED: 'live_view' object missing from response")
        return False
        
    live_view = data["live_view"]
    if not live_view.get("available"):
        print("FAILED: live_view.available is not True")
        return False
        
    url = live_view.get("url")
    if not url:
        print("FAILED: live_view.url is missing")
        return False
        
    print(f"SUCCESS: Generated Signed URL: {url}")
    
    print("\n=== Test 2: Fetching Valid URL ===")
    # Replace Tailscale IP or dynamic hostname with localhost for local VPS request verification
    # e.g. http://100.71.162.5:3000/live/job_xxx?token=xxx -> http://localhost:3000/live/job_xxx?token=xxx
    local_url = url.replace("100.71.162.5:3000", "localhost:3000")
    print(f"Fetching from localhost endpoint: {local_url}")
    
    r_fetch = requests.get(local_url)
    if r_fetch.status_code != 200:
        print(f"FAILED: Fetching live view returned {r_fetch.status_code}: {r_fetch.text}")
        return False
        
    html_content = r_fetch.text
    if "noVNC Live View" not in html_content:
        print("FAILED: Live view stub HTML does not contain 'noVNC Live View' placeholder")
        return False
        
    print("SUCCESS: Live view HTML loaded successfully!")
    
    print("\n=== Test 3: Fetching Tampered URL ===")
    # Change last character of the token to invalidate the signature
    tampered_url = local_url[:-1] + ("0" if local_url[-1] != "0" else "1")
    print(f"Fetching from tampered endpoint: {tampered_url}")
    
    r_tamper = requests.get(tampered_url)
    if r_tamper.status_code != 401:
        print(f"FAILED: Tampered URL returned {r_tamper.status_code} (expected 401)")
        return False
        
    print(f"SUCCESS: Tampered URL correctly rejected with 401! Response: {r_tamper.json()}")
    return True

if __name__ == "__main__":
    success = test_live_view_flow()
    if success:
        print("\nALL LIVE VIEW MVP VERIFICATION TESTS PASSED!")
        sys.exit(0)
    else:
        print("\nVERIFICATION TESTS FAILED!")
        sys.exit(1)
