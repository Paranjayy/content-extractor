// Test script to verify frontend URL extraction matches backend
const testUrls = [
    'https://x.com/gdb',
    'https://www.reddit.com/r/RCB/comments/1kwuj95/we_kohlified_into_qualifier1/',
    'https://www.youtube.com/watch?v=xgmTC0YqCho',
    'https://github.com/Paranjayy/my-notes-public',
    'https://paranjayy.github.io/my-notes-public/Markdown-Tips-and-Tricks'
];

const BACKEND_API_BASE = 'http://localhost:5002/api';

async function testFetch(url) {
    try {
        console.log(`🔍 Testing: ${url}`);
        const response = await fetch(`${BACKEND_API_BASE}/extract-url-metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                url: url,
                includeDescription: true,
                includeOgData: true
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log(`✅ SUCCESS: ${data.title}`);
                return true;
            } else {
                console.log(`❌ FAILED: ${data.error}`);
                return false;
            }
        } else {
            console.log(`❌ HTTP ERROR: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ NETWORK ERROR: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Testing Frontend URL Extraction Fix');
    console.log('=' .repeat(50));
    
    let passed = 0, total = testUrls.length;
    
    for (const url of testUrls) {
        const success = await testFetch(url);
        if (success) passed++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
    
    console.log('=' .repeat(50));
    console.log(`🎯 Results: ${passed}/${total} URLs extracted successfully`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Frontend should now work correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check the backend and CORS settings.');
    }
}

// Run in browser console or Node.js
if (typeof window !== 'undefined') {
    // Browser environment
    runTests();
} else {
    // Node.js environment
    console.log('Run this script in the browser console on http://localhost:8000');
} 