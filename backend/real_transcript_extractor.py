#!/usr/bin/env python3
"""
Real YouTube Transcript Extractor - Server Version
This script actually extracts real transcripts and can be used as a backend service
"""

import os
import re
import json
import requests
from datetime import datetime
from urllib.parse import urlparse, parse_qs

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
except ImportError:
    print("Installing required packages...")
    os.system("pip3 install youtube-transcript-api requests")
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

class RealTranscriptExtractor:
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

    def get_video_metadata(self, video_id):
        """Get video metadata using YouTube oEmbed API"""
        try:
            response = requests.get(f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json")
            if response.status_code == 200:
                data = response.json()
                return {
                    'video_id': video_id,
                    'title': data.get('title', 'Unknown'),
                    'channel': data.get('author_name', 'Unknown'),
                    'thumbnail': data.get('thumbnail_url', ''),
                    'url': f"https://www.youtube.com/watch?v={video_id}"
                }
        except Exception as e:
            print(f"Failed to get metadata for {video_id}: {e}")
        
        return {
            'video_id': video_id,
            'title': 'Unknown',
            'channel': 'Unknown',
            'thumbnail': f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            'url': f"https://www.youtube.com/watch?v={video_id}"
        }

    def extract_transcript(self, video_id, languages=['en']):
        """Extract real transcript for a video"""
        try:
            # Get list of available transcripts
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # Try to find transcript in preferred languages
            for lang in languages:
                try:
                    transcript = transcript_list.find_transcript([lang])
                    return transcript.fetch(), lang
                except NoTranscriptFound:
                    continue
            
            # Try manually created transcripts first
            try:
                transcript = transcript_list.find_manually_created_transcript(languages)
                return transcript.fetch(), transcript.language_code
            except NoTranscriptFound:
                pass
            
            # Fall back to auto-generated
            try:
                transcript = transcript_list.find_generated_transcript(languages)
                return transcript.fetch(), transcript.language_code
            except NoTranscriptFound:
                pass
            
            # Try any available transcript
            for transcript in transcript_list:
                try:
                    return transcript.fetch(), transcript.language_code
                except:
                    continue
            
            return None, None
            
        except (TranscriptsDisabled, VideoUnavailable) as e:
            print(f"Transcript not available for {video_id}: {e}")
            return None, None
        except Exception as e:
            print(f"Error extracting transcript for {video_id}: {e}")
            return None, None

    def format_transcript_with_timestamps(self, transcript):
        """Format transcript with proper timestamps"""
        formatted_lines = []
        for entry in transcript:
            start_time = entry.start if hasattr(entry, 'start') else entry['start']
            text = entry.text.strip() if hasattr(entry, 'text') else entry['text'].strip()
            
            # Convert seconds to MM:SS or HH:MM:SS format
            if start_time >= 3600:  # 1 hour or more
                hours = int(start_time // 3600)
                minutes = int((start_time % 3600) // 60)
                seconds = int(start_time % 60)
                timestamp = f"({hours:02d}:{minutes:02d}:{seconds:02d})"
            else:
                minutes = int(start_time // 60)
                seconds = int(start_time % 60)
                timestamp = f"({minutes:02d}:{seconds:02d})"
            
            formatted_lines.append(f"{timestamp} {text}")
        
        return "\n".join(formatted_lines)

    def format_markdown_output(self, metadata, transcript_text):
        """Format output as markdown"""
        markdown = f"[({metadata['title']}) - YouTube]({metadata['url']})\n\n"
        markdown += f"Channel: {metadata['channel']}\n\n"
        markdown += f"Transcript:\n{transcript_text}"
        return markdown

    def process_video(self, url):
        """Process a single video and return formatted result"""
        video_id = self.extract_video_id(url)
        if not video_id:
            return {'error': 'Invalid YouTube URL'}
        
        print(f"Processing video: {video_id}")
        
        # Get metadata
        metadata = self.get_video_metadata(video_id)
        
        # Extract transcript
        transcript_data, transcript_lang = self.extract_transcript(video_id)
        
        if transcript_data is None:
            return {'error': 'No transcript available'}
        
        # Format transcript
        transcript_text = self.format_transcript_with_timestamps(transcript_data)
        
        # Create markdown output
        markdown_output = self.format_markdown_output(metadata, transcript_text)
        
        return {
            'success': True,
            'video_id': video_id,
            'metadata': metadata,
            'transcript_data': transcript_data,
            'transcript_text': transcript_text,
            'transcript_language': transcript_lang,
            'markdown_output': markdown_output
        }

def main():
    extractor = RealTranscriptExtractor()
    
    print("🎬 Real YouTube Transcript Extractor")
    print("=" * 40)
    
    while True:
        url = input("\nEnter YouTube URL (or 'quit' to exit): ").strip()
        
        if url.lower() in ['quit', 'exit', 'q']:
            break
        
        if not url:
            continue
        
        result = extractor.process_video(url)
        
        if 'error' in result:
            print(f"❌ Error: {result['error']}")
        else:
            print(f"✅ Successfully extracted transcript for: {result['metadata']['title']}")
            print(f"📝 Language: {result['transcript_language']}")
            print(f"📊 Lines: {len(result['transcript_data'])}")
            
            # Save to file
            filename = f"{result['video_id']}_transcript.md"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(result['markdown_output'])
            print(f"💾 Saved to: {filename}")
            
            # Show preview
            print("\n📋 Preview:")
            print("-" * 40)
            preview_lines = result['transcript_text'].split('\n')[:5]
            for line in preview_lines:
                print(line)
            if len(result['transcript_data']) > 5:
                print(f"... and {len(result['transcript_data']) - 5} more lines")

if __name__ == "__main__":
    main() 