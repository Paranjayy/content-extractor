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
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def extract_metadata(self, url, include_description=True, include_og_data=True):
        """Extract metadata from URL with multiple fallback strategies"""
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
        """Extract Reddit post metadata with API fallback"""
        try:
            # Try Reddit JSON API first
            json_url = url.rstrip('/') + '.json'
            response = self.session.get(json_url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0 and 'data' in data[0]:
                    post_data = data[0]['data']['children'][0]['data']
                    
                    # Format title as [title : r/subreddit](url)
                    raw_title = post_data.get('title', 'Reddit Post')
                    subreddit = post_data.get('subreddit', 'unknown')
                    title = f"{raw_title} : r/{subreddit}"
                    
                    description = post_data.get('selftext', '')[:200] + '...' if post_data.get('selftext') else f"r/{subreddit} • {post_data.get('score', 0)} upvotes"
                    thumbnail = post_data.get('thumbnail') if post_data.get('thumbnail') not in ['self', 'default', ''] else None
                    
                    return {
                        'title': title,
                        'description': description if include_description else '',
                        'thumbnail': thumbnail,
                        'domain': 'reddit.com',
                        'og_data': {
                            'subreddit': post_data.get('subreddit'),
                            'score': post_data.get('score'),
                            'num_comments': post_data.get('num_comments'),
                            'author': post_data.get('author')
                        } if include_og_data else {}
                    }
        except Exception as e:
            print(f"Reddit API failed: {e}")
        
        # Fallback to generic scraping
        return self._extract_generic_metadata(url, include_description, include_og_data)

    def _extract_twitter_metadata(self, url, include_description=True, include_og_data=True):
        """Extract Twitter/X metadata with fallback strategies"""
        try:
            # Try different user agents for Twitter
            headers = {
                'User-Agent': 'Twitterbot/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
            
            response = self.session.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract tweet content
                title = self.extract_title(soup, url)
                description = self.extract_description(soup) if include_description else ''
                og_data = self.extract_og_data(soup) if include_og_data else {}
                
                # Look for Twitter-specific meta tags
                twitter_title = soup.find('meta', {'name': 'twitter:title'})
                twitter_desc = soup.find('meta', {'name': 'twitter:description'})
                twitter_image = soup.find('meta', {'name': 'twitter:image'})
                
                if twitter_title:
                    title = twitter_title.get('content', title)
                if twitter_desc and include_description:
                    description = twitter_desc.get('content', description)
                
                thumbnail = None
                if twitter_image:
                    thumbnail = twitter_image.get('content')
                elif og_data.get('image'):
                    thumbnail = og_data['image']
                
                return {
                    'title': title or 'X/Twitter Post',
                    'description': description,
                    'thumbnail': thumbnail,
                    'domain': 'x.com' if 'x.com' in url else 'twitter.com',
                    'og_data': og_data
                }
        except Exception as e:
            print(f"Twitter extraction failed: {e}")
        
        # Fallback to generic extraction
        return self._extract_generic_metadata(url, include_description, include_og_data)

    def _extract_youtube_metadata(self, url, include_description=True, include_og_data=True):
        """Extract YouTube metadata using video ID extraction"""
        try:
            extractor = TranscriptExtractor()
            video_id = extractor.extract_video_id(url)
            
            if video_id:
                metadata = extractor.get_enhanced_metadata(video_id)
                return {
                    'title': metadata['title'],
                    'description': metadata['description'][:200] + '...' if include_description and metadata['description'] else '',
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
        
        return self._extract_generic_metadata(url, include_description, include_og_data)

    def _extract_github_metadata(self, url, include_description=True, include_og_data=True):
        """Extract GitHub repository metadata with API fallback"""
        try:
            # Try GitHub API for repositories
            if '/tree/' in url or '/blob/' in url or '/releases/' in url or '/issues/' in url:
                # For file/tree URLs, extract repo info
                parts = url.replace('https://github.com/', '').split('/')
                if len(parts) >= 2:
                    api_url = f"https://api.github.com/repos/{parts[0]}/{parts[1]}"
                    response = self.session.get(api_url, timeout=10)
                    
                    if response.status_code == 200:
                        repo_data = response.json()
                        title = f"{repo_data['name']} - {repo_data['full_name']}"
                        description = repo_data.get('description', '') if include_description else ''
                        
                        return {
                            'title': title,
                            'description': description,
                            'thumbnail': repo_data['owner']['avatar_url'],
                            'domain': 'github.com',
                            'og_data': {
                                'stars': repo_data.get('stargazers_count'),
                                'forks': repo_data.get('forks_count'),
                                'language': repo_data.get('language'),
                                'owner': repo_data['owner']['login']
                            } if include_og_data else {}
                        }
            elif '/repos/' in url or url.count('/') == 4:  # Direct repo URL
                # Extract owner/repo from direct repo URL
                parts = url.replace('https://github.com/', '').rstrip('/').split('/')
                if len(parts) >= 2:
                    api_url = f"https://api.github.com/repos/{parts[0]}/{parts[1]}"
                    response = self.session.get(api_url, timeout=10)
                    
                    if response.status_code == 200:
                        repo_data = response.json()
                        title = f"GitHub - {repo_data['full_name']}"
                        description = repo_data.get('description', '') if include_description else ''
                        
                        return {
                            'title': title,
                            'description': description,
                            'thumbnail': repo_data['owner']['avatar_url'],
                            'domain': 'github.com',
                            'og_data': {
                                'stars': repo_data.get('stargazers_count'),
                                'forks': repo_data.get('forks_count'),
                                'language': repo_data.get('language'),
                                'owner': repo_data['owner']['login']
                            } if include_og_data else {}
                        }
        except Exception as e:
            print(f"GitHub API failed: {e}")
        
        return self._extract_generic_metadata(url, include_description, include_og_data)

    def _extract_generic_metadata(self, url, include_description=True, include_og_data=True):
        """Generic metadata extraction with multiple fallback strategies"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = self.extract_title(soup, url)
            description = self.extract_description(soup) if include_description else ''
            og_data = self.extract_og_data(soup) if include_og_data else {}
            
            # Extract thumbnail from various sources
            thumbnail = None
            
            # Try Open Graph image
            og_image = soup.find('meta', property='og:image')
            if og_image:
                thumbnail = og_image.get('content')
            
            # Try Twitter card image
            if not thumbnail:
                twitter_image = soup.find('meta', {'name': 'twitter:image'})
                if twitter_image:
                    thumbnail = twitter_image.get('content')
            
            # Try favicon as fallback
            if not thumbnail:
                favicon = soup.find('link', rel='icon') or soup.find('link', rel='shortcut icon')
                if favicon:
                    favicon_url = favicon.get('href')
                    if favicon_url:
                        if favicon_url.startswith('//'):
                            favicon_url = 'https:' + favicon_url
                        elif favicon_url.startswith('/'):
                            domain = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
                            favicon_url = domain + favicon_url
                        thumbnail = favicon_url
            
            return {
                'title': title,
                'description': description,
                'thumbnail': thumbnail,
                'domain': urlparse(url).netloc,
                'og_data': og_data
            }
            
        except requests.exceptions.Timeout:
            return self._fallback_metadata(url, "Request timeout")
        except requests.exceptions.RequestException as e:
            return self._fallback_metadata(url, f"Request failed: {str(e)}")
        except Exception as e:
            return self._fallback_metadata(url, f"Parsing failed: {str(e)}")

    def _fallback_metadata(self, url, error_msg):
        """Fallback metadata when all extraction methods fail"""
        domain = urlparse(url).netloc
        return {
            'title': domain,
            'description': f"Unable to fetch URL metadata from any source",
            'thumbnail': None,
            'domain': domain,
            'og_data': {},
            'error': error_msg
        }

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