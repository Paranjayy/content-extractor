#!/usr/bin/env python3
"""
Test script for URL metadata extraction
"""

import requests
import json

# Test URLs provided by user
test_urls = [
    "https://x.com/gdb",
    "https://www.reddit.com/r/RCB/comments/1kwuj95/we_kohlified_into_qualifier1/",
    "https://www.youtube.com/watch?v=xgmTC0YqCho",
    "https://github.com/Paranjayy/my-notes-public",
    "https://paranjayy.github.io/my-notes-public/Markdown-Tips-and-Tricks"
]

def test_url_extraction(url):
    """Test URL metadata extraction"""
    try:
        response = requests.post('http://localhost:5000/api/extract-url-metadata', 
                               json={'url': url},
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ SUCCESS: {url}")
            print(f"Title: {data.get('title', 'N/A')}")
            print(f"Description: {data.get('description', 'N/A')[:100]}...")
            print(f"Domain: {data.get('domain', 'N/A')}")
            print(f"Thumbnail: {data.get('thumbnail', 'N/A')}")
            if data.get('og_data'):
                print(f"Extra Data: {json.dumps(data['og_data'], indent=2)}")
        else:
            print(f"\n❌ FAILED: {url}")
            print(f"Status: {response.status_code}")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"\n🔌 CONNECTION ERROR: {url} - Backend not running?")
    except Exception as e:
        print(f"\n💥 ERROR: {url} - {str(e)}")

if __name__ == "__main__":
    print("🧪 Testing URL Metadata Extraction with Fallback APIs")
    print("=" * 60)
    
    for url in test_urls:
        test_url_extraction(url)
    
    print("\n" + "=" * 60)
    print("🎯 Test completed!") 