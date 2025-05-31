#!/usr/bin/env python3
"""
Local URL Metadata Testing Script
Tests all URLs locally to verify extraction works
"""

import requests
import json
from datetime import datetime

# Test URLs from user
TEST_URLS = [
    'https://x.com/gdb',
    'https://www.reddit.com/r/RCB/comments/1kwuj95/we_kohlified_into_qualifier1/',
    'https://www.youtube.com/watch?v=xgmTC0YqCho',
    'https://github.com/Paranjayy/my-notes-public',
    'https://paranjayy.github.io/my-notes-public/Markdown-Tips-and-Tricks'
]

BACKEND_API_BASE = 'http://localhost:5002/api'

def test_url_extraction(url):
    """Test URL metadata extraction"""
    try:
        print(f"\n🔍 Testing: {url}")
        
        # Test backend API
        response = requests.post(
            f"{BACKEND_API_BASE}/extract-url-metadata",
            headers={'Content-Type': 'application/json'},
            json={
                'url': url,
                'includeDescription': True,
                'includeOgData': True
            },
            timeout=15
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                print(f"✅ SUCCESS")
                print(f"   Title: {data.get('title', 'N/A')}")
                print(f"   Description: {data.get('description', 'N/A')[:100]}...")
                print(f"   Domain: {data.get('domain', 'N/A')}")
                print(f"   Thumbnail: {'Yes' if data.get('thumbnail') else 'No'}")
                
                # Generate markdown link
                title = data.get('title', 'No title')
                markdown = f"[{title}]({url})"
                print(f"   Markdown: {markdown}")
                
                return {
                    'success': True,
                    'url': url,
                    'title': data.get('title'),
                    'description': data.get('description'),
                    'domain': data.get('domain'),
                    'thumbnail': data.get('thumbnail'),
                    'markdown': markdown
                }
            else:
                print(f"❌ FAILED: {data.get('error', 'Unknown error')}")
                return {'success': False, 'url': url, 'error': data.get('error')}
        else:
            error_text = response.text
            print(f"❌ HTTP ERROR: {response.status_code}")
            print(f"   Response: {error_text[:200]}...")
            return {'success': False, 'url': url, 'error': f"HTTP {response.status_code}"}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {str(e)}")
        return {'success': False, 'url': url, 'error': f"Network error: {str(e)}"}
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {str(e)}")
        return {'success': False, 'url': url, 'error': f"Unexpected error: {str(e)}"}

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BACKEND_API_BASE}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy and running")
            return True
        else:
            print(f"⚠️  Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend is not responding: {str(e)}")
        return False

def main():
    print("🧪 Local URL Metadata Extraction Test")
    print("=" * 60)
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔗 Testing {len(TEST_URLS)} URLs")
    print("=" * 60)
    
    # Test backend health first
    if not test_backend_health():
        print("\n❌ Backend is not running! Please start it with: python3 app.py")
        return
    
    results = []
    successful = 0
    
    for url in TEST_URLS:
        result = test_url_extraction(url)
        results.append(result)
        if result['success']:
            successful += 1
        
        # Small delay between requests
        import time
        time.sleep(1)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY RESULTS")
    print("=" * 60)
    print(f"✅ Successful: {successful}/{len(TEST_URLS)}")
    print(f"❌ Failed: {len(TEST_URLS) - successful}/{len(TEST_URLS)}")
    
    if successful == len(TEST_URLS):
        print("\n🎉 ALL TESTS PASSED!")
        print("   The backend is working correctly.")
        print("   If the website isn't working, it's a frontend issue.")
    else:
        print(f"\n⚠️  {len(TEST_URLS) - successful} TESTS FAILED")
        print("   Check the backend configuration and network connectivity.")
    
    # Save detailed results
    with open('url_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_urls': len(TEST_URLS),
            'successful': successful,
            'failed': len(TEST_URLS) - successful,
            'results': results
        }, f, indent=2)
    
    print(f"\n📁 Detailed results saved to: url_test_results.json")

if __name__ == "__main__":
    main() 