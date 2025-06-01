import requests
import json

test_urls = [
    "https://x.com/gdb",
    "https://www.reddit.com/r/RCB/comments/1kwuj95/we_kohlified_into_qualifier1/",
    "https://www.youtube.com/watch?v=xgmTC0YqCho",
    "https://github.com/Paranjayy/my-notes-public",
    "https://paranjayy.github.io/my-notes-public/Markdown-Tips-and-Tricks"
]

print("🧪 Testing URL Metadata Extraction with Fallback APIs")
print("=" * 60)

for url in test_urls:
    try:
        response = requests.post("http://localhost:5002/api/extract-url-metadata", 
                               json={"url": url}, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ SUCCESS: {url}")
            print(f"Title: {data.get('title', 'N/A')}")
            print(f"Description: {data.get('description', 'N/A')[:100]}...")
            print(f"Domain: {data.get('domain', 'N/A')}")
            print(f"Thumbnail: {'Yes' if data.get('thumbnail') else 'No'}")
            if data.get('og_data'):
                print(f"Extra Data: {list(data['og_data'].keys())[:3]}")
        else:
            print(f"\n❌ FAILED: {url}")
            print(f"Status: {response.status_code}")
    except Exception as e:
        print(f"\n💥 ERROR: {url} - {str(e)}")

print("\n" + "=" * 60)
print("🎯 Test completed!") 