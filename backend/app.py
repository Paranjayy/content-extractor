#!/usr/bin/env python3
"""
Flask Backend for YouTube Transcript Extractor Pro
Handles real transcript extraction and playlist processing
"""

import os
import re
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing required packages...")
    os.system("pip3 install youtube-transcript-api requests flask flask-cors python-dotenv beautifulsoup4")
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
    from bs4 import BeautifulSoup

app = Flask(__name__)

# CORS configuration for production
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:8000,https://*.github.io,https://*.netlify.app,https://*.vercel.app').split(',')
CORS(app, origins=cors_origins)

# YouTube Data API configuration - use environment variable if available
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', 'AIzaSyAV_j5IsZlkXNtkadQ7HQiocTYysm9kvH0')
YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

class TranscriptExtractor:
    def extract_video_id(self, url):
        """Extract video ID from various YouTube URL formats"""
        patterns = [
            r'(?:v=|/)([0-9A-Za-z_-]{11}).*',
            r'(?:embed/)([0-9A-Za-z_-]{11})',
            r'(?:watch\?v=|/)([0-9A-Za-z_-]{11})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        if len(url) == 11 and re.match(r'^[0-9A-Za-z_-]+$', url):
            return url
        
        return None

    def extract_playlist_id(self, url):
        """Extract playlist ID from YouTube playlist URL"""
        try:
            parsed_url = urlparse(url)
            
            # Handle different playlist URL formats
            if 'playlist' in url and 'list=' in url:
                if 'list=' in parsed_url.query:
                    return parse_qs(parsed_url.query).get('list', [None])[0]
                elif 'list=' in url:
                    # Handle cases where list= is in the fragment or malformed URLs
                    import re
                    match = re.search(r'list=([^&]+)', url)
                    if match:
                        return match.group(1)
            
            return None
        except Exception as e:
            print(f"Error extracting playlist ID from {url}: {e}")
            return None

    def get_enhanced_metadata(self, video_id):
        """Get enhanced metadata using YouTube Data API v3"""
        try:
            video_url = f"{YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id={video_id}&key={YOUTUBE_API_KEY}"
            response = requests.get(video_url)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('items'):
                    video = data['items'][0]
                    snippet = video['snippet']
                    statistics = video['statistics']
                    contentDetails = video['contentDetails']
                    
                    # Parse duration (PT4M13S format)
                    duration = self.parse_duration(contentDetails['duration'])
                    
                    return {
                        'title': snippet['title'],
                        'channel': snippet['channelTitle'],
                        'thumbnail': snippet['thumbnails'].get('maxres', {}).get('url') or 
                                   snippet['thumbnails'].get('high', {}).get('url') or 
                                   snippet['thumbnails']['default']['url'],
                        'views': int(statistics.get('viewCount', 0)),
                        'likes': int(statistics.get('likeCount', 0)),
                        'comments': int(statistics.get('commentCount', 0)),
                        'duration': duration,
                        'publishDate': snippet['publishedAt'],
                        'description': snippet['description'],
                        'url': f"https://www.youtube.com/watch?v={video_id}"
                    }
            
            # Fallback to oEmbed
            oembed_response = requests.get(f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json")
            if oembed_response.status_code == 200:
                oembed_data = oembed_response.json()
                return {
                    'title': oembed_data['title'],
                    'channel': oembed_data['author_name'],
                    'thumbnail': oembed_data['thumbnail_url'],
                    'views': 'API Error',
                    'likes': 'API Error',
                    'comments': 'API Error',
                    'duration': 'Unknown',
                    'publishDate': 'Unknown',
                    'description': 'Description not available',
                    'url': f"https://www.youtube.com/watch?v={video_id}"
                }
                
        except Exception as e:
            print(f"Metadata extraction failed: {e}")
        
        return {
            'title': 'Video Title (Unable to fetch)',
            'channel': 'Channel Name (Unable to fetch)',
            'thumbnail': f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            'views': 'Error',
            'likes': 'Error',
            'comments': 'Error',
            'duration': 'Unknown',
            'publishDate': 'Unknown',
            'description': 'Metadata not available',
            'url': f"https://www.youtube.com/watch?v={video_id}"
        }

    def parse_duration(self, duration):
        """Parse YouTube duration format (PT4M13S) to seconds"""
        match = re.match(r'PT(\d+H)?(\d+M)?(\d+S)?', duration)
        if not match:
            return 'Unknown'
        
        hours = int(match.group(1)[:-1]) if match.group(1) else 0
        minutes = int(match.group(2)[:-1]) if match.group(2) else 0
        seconds = int(match.group(3)[:-1]) if match.group(3) else 0
        
        return hours * 3600 + minutes * 60 + seconds

    def extract_transcript(self, video_id, languages=['en']):
        """Extract real transcript using youtube-transcript-api - Fixed version"""
        try:
            print(f"🔍 Attempting to extract transcript for video: {video_id}")
            
            # Get list of available transcripts
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            available_languages = [t.language_code for t in transcript_list]
            print(f"📋 Available transcripts: {available_languages}")
            
            # Try to find transcript in preferred languages
            for lang in languages:
                try:
                    transcript = transcript_list.find_transcript([lang])
                    result = transcript.fetch()
                    print(f"✅ Found transcript in language: {lang}, lines: {len(result)}")
                    return result, lang
                except NoTranscriptFound:
                    print(f"❌ No transcript found for language: {lang}")
                    continue
            
            # Try manually created transcripts first
            try:
                for transcript in transcript_list:
                    if not transcript.is_generated:
                        result = transcript.fetch()
                        print(f"✅ Found manual transcript: {transcript.language_code}, lines: {len(result)}")
                        return result, transcript.language_code
            except Exception as e:
                print(f"❌ Error with manual transcripts: {e}")
            
            # Fall back to auto-generated
            try:
                for transcript in transcript_list:
                    if transcript.is_generated:
                        result = transcript.fetch()
                        print(f"✅ Found auto-generated transcript: {transcript.language_code}, lines: {len(result)}")
                        return result, transcript.language_code
            except Exception as e:
                print(f"❌ Error with auto-generated transcripts: {e}")
            
            # Try any available transcript as last resort
            try:
                for transcript in transcript_list:
                    result = transcript.fetch()
                    print(f"✅ Found transcript in: {transcript.language_code}, lines: {len(result)}")
                    return result, transcript.language_code
            except Exception as e:
                print(f"❌ Failed to fetch any transcript: {e}")
            
            print("❌ No transcripts could be fetched")
            return None, None
            
        except TranscriptsDisabled:
            print(f"❌ Transcripts are disabled for video: {video_id}")
            return None, None
        except VideoUnavailable:
            print(f"❌ Video is unavailable: {video_id}")
            return None, None
        except Exception as e:
            print(f"❌ Unexpected error extracting transcript for {video_id}: {e}")
            import traceback
            traceback.print_exc()
            return None, None

    def get_playlist_videos(self, playlist_id, max_results=50):
        """Get video IDs from a YouTube playlist"""
        try:
            videos = []
            next_page_token = None
            
            while len(videos) < max_results:
                url = f"{YOUTUBE_API_BASE}/playlistItems?part=snippet&playlistId={playlist_id}&maxResults=50&key={YOUTUBE_API_KEY}"
                if next_page_token:
                    url += f"&pageToken={next_page_token}"
                
                response = requests.get(url)
                if response.status_code != 200:
                    break
                
                data = response.json()
                for item in data.get('items', []):
                    if len(videos) >= max_results:
                        break
                    videos.append(item['snippet']['resourceId']['videoId'])
                
                next_page_token = data.get('nextPageToken')
                if not next_page_token:
                    break
            
            return videos
        except Exception as e:
            print(f"Error getting playlist videos: {e}")
            return []

extractor = TranscriptExtractor()

@app.route('/api/extract', methods=['POST'])
def extract_transcript():
    """Extract transcript for a single video"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        video_id = extractor.extract_video_id(url)
        if not video_id:
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        # Get metadata and transcript
        metadata = extractor.get_enhanced_metadata(video_id)
        transcript_data, transcript_lang = extractor.extract_transcript(video_id)
        
        if transcript_data is None:
            return jsonify({'error': 'No transcript available for this video'}), 404
        
        # Format transcript with timestamps
        formatted_transcript = []
        for entry in transcript_data:
            formatted_transcript.append({
                'start': entry.start if hasattr(entry, 'start') else entry['start'],
                'text': entry.text.strip() if hasattr(entry, 'text') else entry['text'].strip()
            })
        
        return jsonify({
            'success': True,
            'videoId': video_id,
            'metadata': metadata,
            'transcript': formatted_transcript,
            'transcriptLanguage': transcript_lang,
            'extractedAt': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/extract-playlist', methods=['POST'])
def extract_playlist():
    """Extract transcripts for all videos in a playlist"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        max_videos = min(int(data.get('maxVideos', 25)), 100)
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Check if it's a playlist URL
        playlist_id = extractor.extract_playlist_id(url)
        if not playlist_id:
            return jsonify({'error': 'Invalid YouTube playlist URL'}), 400
        
        # Get video IDs from playlist
        video_ids = extractor.get_playlist_videos(playlist_id, max_videos)
        if not video_ids:
            return jsonify({'error': 'Could not retrieve videos from playlist'}), 404
        
        results = []
        for i, video_id in enumerate(video_ids):
            try:
                metadata = extractor.get_enhanced_metadata(video_id)
                transcript_data, transcript_lang = extractor.extract_transcript(video_id)
                
                if transcript_data:
                    formatted_transcript = []
                    for entry in transcript_data:
                        formatted_transcript.append({
                            'start': entry.start if hasattr(entry, 'start') else entry['start'],
                            'text': entry.text.strip() if hasattr(entry, 'text') else entry['text'].strip()
                        })
                    
                    results.append({
                        'success': True,
                        'videoId': video_id,
                        'metadata': metadata,
                        'transcript': formatted_transcript,
                        'transcriptLanguage': transcript_lang
                    })
                else:
                    results.append({
                        'success': False,
                        'videoId': video_id,
                        'metadata': metadata,
                        'error': 'No transcript available'
                    })
                    
            except Exception as e:
                results.append({
                    'success': False,
                    'videoId': video_id,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'playlistId': playlist_id,
            'totalVideos': len(video_ids),
            'processedVideos': len(results),
            'results': results,
            'extractedAt': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/test-extract/<video_id>', methods=['GET'])
def test_extract(video_id):
    """Test transcript extraction for debugging"""
    try:
        print(f"🧪 Testing extraction for: {video_id}")
        transcript_data, transcript_lang = extractor.extract_transcript(video_id)
        
        if transcript_data:
            return jsonify({
                'success': True,
                'videoId': video_id,
                'transcriptLanguage': transcript_lang,
                'lineCount': len(transcript_data),
                'firstLine': transcript_data[0] if transcript_data else None
            })
        else:
            return jsonify({
                'success': False,
                'videoId': video_id,
                'error': 'No transcript found'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'videoId': video_id,
            'error': str(e)
        })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'YouTube Transcript Extractor API is running'})

@app.route('/')
def serve_frontend():
    """Serve the main application"""
    return app.send_static_file('index.html')

class UrlMetadataExtractor:
    def __init__(self):
        self.session = requests.Session()
        # Use more realistic browser headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        })

    def extract_metadata(self, url, include_description=True, include_og_data=True):
        """Extract metadata from URL with improved fallback strategies"""
        try:
            # Clean URL
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            domain = urlparse(url).netloc.lower()
            
            # Special handling for different platforms
            if 'reddit.com' in domain:
                return self._extract_reddit_metadata(url, include_description, include_og_data)
            elif 'twitter.com' in domain or 'x.com' in domain:
                return self._extract_twitter_metadata(url, include_description, include_og_data)
            elif 'youtube.com' in domain or 'youtu.be' in domain:
                return self._extract_youtube_metadata(url, include_description, include_og_data)
            elif 'github.com' in domain:
                return self._extract_github_metadata(url, include_description, include_og_data)
            else:
                return self._extract_generic_metadata(url, include_description, include_og_data)
                
        except Exception as e:
            return self._fallback_metadata(url, str(e))

    def _extract_reddit_metadata(self, url, include_description=True, include_og_data=True):
        """Extract Reddit post metadata with improved strategies"""
        try:
            # First try: JSON API (most reliable)
            json_url = url.rstrip('/') + '.json'
            headers = {'User-Agent': 'URLMetadataBot/1.0'}
            response = self.session.get(json_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data and len(data) > 0 and 'data' in data[0]:
                        post_data = data[0]['data']['children'][0]['data']
                        
                        raw_title = post_data.get('title', 'Reddit Post')
                        subreddit = post_data.get('subreddit', 'unknown')
                        title = f"{raw_title} : r/{subreddit}"
                        
                        selftext = post_data.get('selftext', '')
                        if selftext and len(selftext) > 10:
                            description = selftext[:200] + '...'
                        else:
                            description = f"r/{subreddit} • {post_data.get('score', 0)} upvotes • {post_data.get('num_comments', 0)} comments"
                        
                        # Try to get thumbnail
                        thumbnail = None
                        if post_data.get('thumbnail') and post_data['thumbnail'] not in ['self', 'default', 'nsfw', '']:
                            thumbnail = post_data['thumbnail']
                        elif post_data.get('url') and any(ext in post_data['url'] for ext in ['.jpg', '.png', '.gif', '.jpeg']):
                            thumbnail = post_data['url']
                        
                        return {
                            'title': title,
                            'description': description if include_description else '',
                            'thumbnail': thumbnail,
                            'domain': 'reddit.com',
                            'og_data': {
                                'subreddit': post_data.get('subreddit'),
                                'score': post_data.get('score'),
                                'num_comments': post_data.get('num_comments'),
                                'author': post_data.get('author'),
                                'created_utc': post_data.get('created_utc')
                            } if include_og_data else {}
                        }
                except json.JSONDecodeError:
                    print("Failed to parse Reddit JSON")
        except Exception as e:
            print(f"Reddit JSON API failed: {e}")
        
        # Second try: Old Reddit (more lenient)
        try:
            old_reddit_url = url.replace('www.reddit.com', 'old.reddit.com').replace('reddit.com', 'old.reddit.com')
            response = self.session.get(old_reddit_url, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract title from old reddit format
                title_element = soup.find('a', class_='title') or soup.find('h1')
                if title_element:
                    title = title_element.get_text().strip()
                    
                    # Try to get subreddit
                    subreddit_element = soup.find('a', href=re.compile(r'/r/\w+'))
                    subreddit = 'unknown'
                    if subreddit_element:
                        subreddit = subreddit_element.get_text().replace('/r/', '').replace('r/', '')
                    
                    final_title = f"{title} : r/{subreddit}"
                    
                    return {
                        'title': final_title,
                        'description': f"Reddit post from r/{subreddit}" if include_description else '',
                        'thumbnail': None,
                        'domain': 'reddit.com',
                        'og_data': {'subreddit': subreddit} if include_og_data else {}
                    }
        except Exception as e:
            print(f"Old Reddit fallback failed: {e}")
        
        # Final fallback to generic extraction
        return self._extract_generic_metadata(url, include_description, include_og_data)

    def _extract_twitter_metadata(self, url, include_description=True, include_og_data=True):
        """Extract Twitter/X metadata with multiple strategies to bypass bot detection"""
        strategies = [
            # Strategy 1: Mobile user agent (often less restricted)
            {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            # Strategy 2: Twitter app user agent
            {
                'User-Agent': 'Twitterbot/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            # Strategy 3: Generic bot (sometimes works)
            {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            # Strategy 4: Try without authentication requirements
            {
                'User-Agent': 'curl/7.64.1',
                'Accept': '*/*',
            }
        ]
        
        for i, headers in enumerate(strategies):
            try:
                print(f"Twitter extraction strategy {i+1}")
                response = self.session.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Check if we got blocked (common X.com blocking patterns)
                    if 'JavaScript is not available' in response.text or 'Enable JavaScript' in response.text:
                        print(f"Strategy {i+1}: JavaScript requirement detected")
                        continue
                    
                    # Extract title
                    title = self.extract_title(soup, url)
                    
                    # Skip if we got generic blocking page
                    if 'JavaScript is not available' in title or len(title) < 5:
                        continue
                    
                    description = self.extract_description(soup) if include_description else ''
                    og_data = self.extract_og_data(soup) if include_og_data else {}
                    
                    # Look for Twitter-specific meta tags
                    twitter_title = soup.find('meta', {'name': 'twitter:title'})
                    twitter_desc = soup.find('meta', {'name': 'twitter:description'})
                    twitter_image = soup.find('meta', {'name': 'twitter:image'})
                    
                    if twitter_title and twitter_title.get('content'):
                        title = twitter_title.get('content')
                    if twitter_desc and twitter_desc.get('content') and include_description:
                        description = twitter_desc.get('content')
                    
                    thumbnail = None
                    if twitter_image and twitter_image.get('content'):
                        thumbnail = twitter_image.get('content')
                    elif og_data.get('image'):
                        thumbnail = og_data['image']
                    
                    # If we got meaningful content, return it
                    if len(title) > 5 and not 'JavaScript' in title:
                        return {
                            'title': title,
                            'description': description,
                            'thumbnail': thumbnail,
                            'domain': 'x.com' if 'x.com' in url else 'twitter.com',
                            'og_data': og_data
                        }
                        
            except Exception as e:
                print(f"Twitter strategy {i+1} failed: {e}")
                continue
        
        # All strategies failed - return minimal info
        print("All Twitter extraction strategies failed")
        return {
            'title': 'X/Twitter Post (Limited Access)',
            'description': 'Content not accessible due to platform restrictions' if include_description else '',
            'thumbnail': 'https://abs.twimg.com/favicons/twitter.3.ico',
            'domain': 'x.com' if 'x.com' in url else 'twitter.com',
            'og_data': {'platform': 'twitter', 'access_limited': True} if include_og_data else {}
        }

    def _extract_youtube_metadata(self, url, include_description=True, include_og_data=True):
        """Extract YouTube metadata using multiple methods"""
        try:
            extractor = TranscriptExtractor()
            video_id = extractor.extract_video_id(url)
            
            if video_id:
                metadata = extractor.get_enhanced_metadata(video_id)
                description = ''
                if include_description and metadata['description']:
                    # Truncate long descriptions
                    desc = metadata['description']
                    description = desc[:300] + '...' if len(desc) > 300 else desc
                
                return {
                    'title': metadata['title'],
                    'description': description,
                    'thumbnail': metadata['thumbnail'],
                    'domain': 'youtube.com',
                    'og_data': {
                        'channel': metadata['channel'],
                        'views': metadata['views'],
                        'duration': metadata['duration'],
                        'publishDate': metadata['publishDate']
                    } if include_og_data else {}
                }
        except Exception as e:
            print(f"YouTube extraction failed: {e}")
        
        # Fallback to generic extraction
        return self._extract_generic_metadata(url, include_description, include_og_data)

    def _extract_github_metadata(self, url, include_description=True, include_og_data=True):
        """Extract GitHub repository metadata with API and fallback strategies"""
        try:
            # Try to parse GitHub URL to get owner/repo
            url_parts = url.replace('https://github.com/', '').rstrip('/').split('/')
            
            if len(url_parts) >= 2:
                owner, repo = url_parts[0], url_parts[1]
                
                # Try GitHub API first (no auth needed for public repos)
                try:
                    api_url = f"https://api.github.com/repos/{owner}/{repo}"
                    api_headers = {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'URLMetadataExtractor/1.0'
                    }
                    response = self.session.get(api_url, headers=api_headers, timeout=10)
                    
                    if response.status_code == 200:
                        repo_data = response.json()
                        
                        # Determine if it's a specific file/folder or main repo
                        if len(url_parts) > 2:
                            # It's a file or subfolder
                            path_part = '/'.join(url_parts[2:])
                            title = f"{repo_data['name']} - {path_part}"
                        else:
                            # Main repository
                            title = f"GitHub - {repo_data['full_name']}"
                        
                        description = repo_data.get('description', '') if include_description else ''
                        
                        return {
                            'title': title,
                            'description': description or '',
                            'thumbnail': repo_data['owner']['avatar_url'],
                            'domain': 'github.com',
                            'og_data': {
                                'stars': repo_data.get('stargazers_count'),
                                'forks': repo_data.get('forks_count'),
                                'language': repo_data.get('language'),
                                'owner': repo_data['owner']['login'],
                                'updated_at': repo_data.get('updated_at')
                            } if include_og_data else {}
                        }
                except Exception as api_error:
                    print(f"GitHub API failed: {api_error}")
                    
        except Exception as e:
            print(f"GitHub URL parsing failed: {e}")
        
        # Fallback to generic extraction
        return self._extract_generic_metadata(url, include_description, include_og_data)

    def _extract_generic_metadata(self, url, include_description=True, include_og_data=True):
        """Improved generic metadata extraction with better error handling"""
        try:
            # Use session with proper headers
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = self.extract_title(soup, url)
            description = self.extract_description(soup) if include_description else ''
            og_data = self.extract_og_data(soup) if include_og_data else {}
            
            # Extract thumbnail with multiple strategies
            thumbnail = self._extract_best_thumbnail(soup, url, og_data)
            
            return {
                'title': title,
                'description': description,
                'thumbnail': thumbnail,
                'domain': urlparse(url).netloc,
                'og_data': og_data
            }
            
        except requests.exceptions.Timeout:
            return self._fallback_metadata(url, "Request timeout (15s)")
        except requests.exceptions.HTTPError as e:
            return self._fallback_metadata(url, f"HTTP error: {e.response.status_code}")
        except requests.exceptions.RequestException as e:
            return self._fallback_metadata(url, f"Request failed: {str(e)}")
        except Exception as e:
            return self._fallback_metadata(url, f"Parsing error: {str(e)}")

    def _extract_best_thumbnail(self, soup, url, og_data):
        """Extract the best available thumbnail/image with improved resolution detection"""
        # Strategy 1: Open Graph image with size preference (highest priority)
        if og_data.get('image'):
            og_image = self._resolve_relative_url(og_data['image'], url)
            # Check for high-res variant
            if og_image:
                # Try to find high-res versions
                high_res_variants = self._find_high_res_variants(og_image, soup)
                if high_res_variants:
                    return high_res_variants[0]  # Return the best one
                return og_image
        
        # Strategy 2: Look for multiple OG images and pick the largest
        og_images = soup.find_all('meta', property='og:image')
        if len(og_images) > 1:
            for img_tag in og_images:
                img_url = img_tag.get('content')
                if img_url and self._is_high_quality_image(img_url):
                    return self._resolve_relative_url(img_url, url)
        
        # Strategy 3: Twitter card image with size preference
        twitter_images = [
            soup.find('meta', {'name': 'twitter:image'}),
            soup.find('meta', {'name': 'twitter:image:src'}),
            soup.find('meta', {'property': 'twitter:image'})
        ]
        
        for twitter_img in twitter_images:
            if twitter_img and twitter_img.get('content'):
                img_url = self._resolve_relative_url(twitter_img.get('content'), url)
                if self._is_high_quality_image(img_url):
                    return img_url
        
        # Strategy 4: Schema.org structured data images
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                images = self._extract_schema_images(data)
                if images:
                    return self._resolve_relative_url(images[0], url)
            except:
                continue
        
        # Strategy 5: Look for high-quality content images
        content_images = self._find_content_images(soup, url)
        if content_images:
            return content_images[0]
        
        # Strategy 6: Apple touch icon (prefer larger sizes)
        apple_icons = soup.find_all('link', rel=lambda x: x and 'apple-touch-icon' in x)
        best_apple_icon = None
        best_size = 0
        
        for icon in apple_icons:
            href = icon.get('href')
            if href:
                size = self._extract_icon_size(icon.get('sizes', ''))
                if size > best_size:
                    best_size = size
                    best_apple_icon = href
        
        if best_apple_icon:
            return self._resolve_relative_url(best_apple_icon, url)
        
        # Strategy 7: Favicon with size preference
        favicons = soup.find_all('link', rel=lambda x: x and 'icon' in x.lower())
        best_favicon = None
        best_size = 0
        
        for favicon in favicons:
            href = favicon.get('href')
            if href:
                size = self._extract_icon_size(favicon.get('sizes', ''))
                if size > best_size:
                    best_size = size
                    best_favicon = href
        
        if best_favicon:
            return self._resolve_relative_url(best_favicon, url)
        
        return None

    def _find_high_res_variants(self, base_image_url, soup):
        """Find high-resolution variants of an image"""
        if not base_image_url:
            return []
        
        variants = []
        
        # Common high-res patterns
        high_res_patterns = [
            lambda url: url.replace('_normal', '_400x400'),  # Twitter
            lambda url: url.replace('_normal', '_bigger'),   # Twitter
            lambda url: url.replace('small', 'large'),       # Generic
            lambda url: url.replace('thumb', 'full'),        # Generic
            lambda url: url.replace('150x150', '1200x1200'), # Square sizes
            lambda url: url.replace('300x300', '1200x1200'), # Square sizes
            lambda url: url + '?w=1200&h=630',               # Query params
        ]
        
        for pattern in high_res_patterns:
            try:
                variant = pattern(base_image_url)
                if variant != base_image_url:
                    variants.append(variant)
            except:
                continue
        
        return variants
    
    def _is_high_quality_image(self, img_url):
        """Check if an image URL indicates high quality"""
        if not img_url:
            return False
            
        high_quality_indicators = [
            'large', 'big', 'full', 'original', 'hd', 'high',
            '1200', '1920', '2048', 'maxres', 'master'
        ]
        
        low_quality_indicators = [
            'thumb', 'small', 'mini', 'icon', 'favicon',
            '32x32', '16x16', '64x64', '128x128'
        ]
        
        url_lower = img_url.lower()
        
        # Penalize low quality indicators
        if any(indicator in url_lower for indicator in low_quality_indicators):
            return False
            
        # Favor high quality indicators
        if any(indicator in url_lower for indicator in high_quality_indicators):
            return True
            
        return True  # Default to true if no specific indicators
    
    def _extract_schema_images(self, data):
        """Extract images from JSON-LD structured data"""
        images = []
        
        def find_images_recursive(obj):
            if isinstance(obj, dict):
                if 'image' in obj:
                    img = obj['image']
                    if isinstance(img, str):
                        images.append(img)
                    elif isinstance(img, list):
                        images.extend([i for i in img if isinstance(i, str)])
                    elif isinstance(img, dict) and 'url' in img:
                        images.append(img['url'])
                
                for value in obj.values():
                    find_images_recursive(value)
            elif isinstance(obj, list):
                for item in obj:
                    find_images_recursive(item)
        
        find_images_recursive(data)
        return images
    
    def _find_content_images(self, soup, base_url):
        """Find high-quality images from page content"""
        images = []
        
        # Look for images in main content areas
        content_selectors = [
            'main img', 'article img', '.content img', 
            '.post img', '.entry img', '#content img'
        ]
        
        for selector in content_selectors:
            imgs = soup.select(selector)
            for img in imgs[:3]:  # Limit to first 3
                src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                if src and self._is_meaningful_content_image(img, src):
                    resolved_url = self._resolve_relative_url(src, base_url)
                    if resolved_url:
                        images.append(resolved_url)
        
        # Also check regular img tags but filter more strictly
        for img in soup.find_all('img', src=True)[:5]:
            src = img.get('src')
            if src and self._is_meaningful_content_image(img, src):
                resolved_url = self._resolve_relative_url(src, base_url)
                if resolved_url and resolved_url not in images:
                    images.append(resolved_url)
        
        # Sort by quality indicators
        return sorted(images, key=lambda url: self._image_quality_score(url), reverse=True)
    
    def _is_meaningful_content_image(self, img_tag, src):
        """Check if an image is meaningful content (not UI elements)"""
        skip_patterns = [
            'logo', 'icon', 'button', 'arrow', 'nav', 'menu',
            'banner', 'ad', 'sidebar', 'footer', 'header',
            'pixel', 'spacer', 'tracking', 'analytics'
        ]
        
        # Check src URL
        src_lower = src.lower()
        if any(pattern in src_lower for pattern in skip_patterns):
            return False
        
        # Check img attributes
        alt = (img_tag.get('alt') or '').lower()
        class_names = ' '.join(img_tag.get('class', [])).lower()
        
        if any(pattern in alt or pattern in class_names for pattern in skip_patterns):
            return False
        
        # Check dimensions if available
        width = img_tag.get('width')
        height = img_tag.get('height')
        
        if width and height:
            try:
                w, h = int(width), int(height)
                # Skip very small images (likely icons/decorations)
                if w < 100 or h < 100:
                    return False
                # Skip very wide/thin images (likely banners)
                if w / h > 5 or h / w > 5:
                    return False
            except ValueError:
                pass
        
        return True
    
    def _image_quality_score(self, img_url):
        """Score an image URL for quality (higher is better)"""
        score = 0
        url_lower = img_url.lower()
        
        # High quality indicators
        high_quality = ['large', 'full', 'original', 'hd', '1200', '1920', 'maxres']
        score += sum(2 for indicator in high_quality if indicator in url_lower)
        
        # Medium quality indicators  
        medium_quality = ['medium', '600', '800', '1000']
        score += sum(1 for indicator in medium_quality if indicator in url_lower)
        
        # Low quality penalties
        low_quality = ['thumb', 'small', 'mini', '150', '200', '300']
        score -= sum(1 for indicator in low_quality if indicator in url_lower)
        
        return score
    
    def _extract_icon_size(self, sizes_attr):
        """Extract numeric size from icon sizes attribute"""
        if not sizes_attr:
            return 0
        
        # Match patterns like "32x32", "180x180", etc.
        import re
        match = re.search(r'(\d+)x\d+', sizes_attr)
        if match:
            return int(match.group(1))
        
        return 0

    def extract_title(self, soup, url):
        """Extract title with multiple fallback strategies"""
        # Try Open Graph title first
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            return og_title['content'].strip()
        
        # Try Twitter card title
        twitter_title = soup.find('meta', {'name': 'twitter:title'})
        if twitter_title and twitter_title.get('content'):
            return twitter_title['content'].strip()
        
        # Try regular title tag
        title_tag = soup.find('title')
        if title_tag and title_tag.text:
            return title_tag.text.strip()
        
        # Try h1 tag
        h1_tag = soup.find('h1')
        if h1_tag and h1_tag.text:
            return h1_tag.text.strip()
        
        # Fallback to domain
        return urlparse(url).netloc

    def extract_description(self, soup):
        """Extract description from meta tags with fallbacks"""
        # Try Open Graph description
        og_desc = soup.find('meta', property='og:description')
        if og_desc and og_desc.get('content'):
            return og_desc['content'].strip()
        
        # Try Twitter card description
        twitter_desc = soup.find('meta', {'name': 'twitter:description'})
        if twitter_desc and twitter_desc.get('content'):
            return twitter_desc['content'].strip()
        
        # Try standard meta description
        meta_desc = soup.find('meta', {'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            return meta_desc['content'].strip()
        
        # Try first paragraph
        first_p = soup.find('p')
        if first_p and first_p.text:
            text = first_p.text.strip()
            return text[:200] + '...' if len(text) > 200 else text
        
        return ''

    def extract_og_data(self, soup):
        """Extract all Open Graph metadata"""
        og_data = {}
        
        og_tags = soup.find_all('meta', property=lambda x: x and x.startswith('og:'))
        for tag in og_tags:
            prop = tag.get('property', '').replace('og:', '')
            content = tag.get('content', '')
            if prop and content:
                og_data[prop] = content
        
        return og_data

    def _resolve_relative_url(self, url_or_path, base_url):
        """Convert relative URLs to absolute URLs"""
        if not url_or_path:
            return None
            
        if url_or_path.startswith('//'):
            return 'https:' + url_or_path
        elif url_or_path.startswith('/'):
            parsed_base = urlparse(base_url)
            return f"{parsed_base.scheme}://{parsed_base.netloc}{url_or_path}"
        elif url_or_path.startswith('http'):
            return url_or_path
        else:
            # Relative path
            base_dir = '/'.join(base_url.rstrip('/').split('/')[:-1])
            return f"{base_dir}/{url_or_path}"

    def _fallback_metadata(self, url, error_msg):
        """Enhanced fallback metadata when all extraction methods fail"""
        domain = urlparse(url).netloc
        
        # Try to make intelligent guesses based on domain
        if 'twitter.com' in domain or 'x.com' in domain:
            title = 'X/Twitter Post'
            description = 'Twitter/X content (access limited)'
            thumbnail = 'https://abs.twimg.com/favicons/twitter.3.ico'
        elif 'reddit.com' in domain:
            title = 'Reddit Post'
            description = 'Reddit content (access limited)'  
            thumbnail = 'https://www.redditstatic.com/favicon.ico'
        elif 'youtube.com' in domain:
            title = 'YouTube Video'
            description = 'YouTube content (access limited)'
            thumbnail = 'https://www.youtube.com/favicon.ico'
        elif 'github.com' in domain:
            title = 'GitHub Repository'
            description = 'GitHub content (access limited)'
            thumbnail = 'https://github.com/favicon.ico'
        else:
            title = domain.replace('www.', '').title()
            description = f'Content from {domain}'
            thumbnail = f'https://www.google.com/s2/favicons?domain={domain}&sz=128'  # Increased icon size
        
        return {
            'title': title,
            'description': description,
            'thumbnail': thumbnail,
            'domain': domain,
            'og_data': {},
            'error': error_msg,
            'fallback': True
        }

url_extractor = UrlMetadataExtractor()

@app.route('/api/extract-url-metadata', methods=['POST'])
def extract_url_metadata():
    """Extract metadata from any URL"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Validate URL format
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        include_description = data.get('includeDescription', True)
        include_og_data = data.get('includeOgData', True)
        
        print(f"🔍 Extracting metadata for: {url}")
        
        # Extract metadata
        metadata = url_extractor.extract_metadata(url, include_description, include_og_data)
        
        # Check if extraction was successful
        if metadata.get('error'):
            print(f"⚠️  Metadata extraction had issues: {metadata['error']}")
            return jsonify({
                'success': False,
                'url': url,
                'title': metadata['title'],
                'description': metadata['description'],
                'domain': metadata['domain'],
                'thumbnail': metadata.get('thumbnail'),
                'ogData': metadata['og_data'],
                'error': metadata['error'],
                'extractedAt': datetime.now().isoformat()
            }), 200  # Still return 200 but with success: false
        
        print(f"✅ Successfully extracted metadata for: {url}")
        return jsonify({
            'success': True,
            'url': url,
            'title': metadata['title'],
            'description': metadata['description'],
            'domain': metadata['domain'],
            'thumbnail': metadata.get('thumbnail'),
            'ogData': metadata['og_data'],
            'extractedAt': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Server error extracting metadata: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    print("🚀 Starting YouTube Transcript Extractor Pro Backend...")
    print("📡 Backend will run on: http://localhost:5002")
    print("🌐 Frontend will still be on: http://localhost:8000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5002) 