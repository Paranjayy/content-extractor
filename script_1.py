# Create a Node.js alternative script
nodejs_script = '''const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

/**
 * YouTube Transcript Extractor - Node.js Version
 * 
 * Requirements:
 * npm install youtube-transcript axios node-fetch csv-writer
 * 
 * Usage:
 * node youtube_transcript_extractor.js
 */

class YouTubeTranscriptExtractor {
    constructor() {
        this.results = [];
        this.failedVideos = [];
        
        // Try to import required modules
        try {
            this.YoutubeTranscript = require('youtube-transcript');
            this.axios = require('axios');
            this.createCsvWriter = require('csv-writer').createObjectCsvWriter;
            console.log('All required modules loaded successfully');
        } catch (error) {
            console.error('Missing required packages. Install with:');
            console.error('npm install youtube-transcript axios csv-writer');
            process.exit(1);
        }
    }
    
    extractVideoId(url) {
        const patterns = [
            /(?:v=|\\/)([0-9A-Za-z_-]{11}).*/,
            /(?:embed\\/)([0-9A-Za-z_-]{11})/,
            /(?:watch\\?v=|\\/)([0-9A-Za-z_-]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        // If it's already just the video ID
        if (url.length === 11 && /^[0-9A-Za-z_-]+$/.test(url)) {
            return url;
        }
        
        return null;
    }
    
    async getVideoMetadata(videoId) {
        try {
            // Use oembed API to get basic metadata
            const response = await this.axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const data = response.data;
            
            return {
                videoId: videoId,
                title: data.title,
                channel: data.author_name,
                views: 'Unknown', // oembed doesn't provide view count
                description: '',
                publishDate: 'Unknown',
                thumbnailUrl: data.thumbnail_url,
                url: `https://www.youtube.com/watch?v=${videoId}`
            };
        } catch (error) {
            console.log(`Failed to get metadata for ${videoId}, using basic info`);
            return {
                videoId: videoId,
                title: 'Unknown',
                channel: 'Unknown', 
                views: 'Unknown',
                description: '',
                publishDate: 'Unknown',
                thumbnailUrl: null,
                url: `https://www.youtube.com/watch?v=${videoId}`
            };
        }
    }
    
    async downloadThumbnail(videoId, thumbnailUrl) {
        if (!thumbnailUrl) return null;
        
        try {
            const dir = './thumbnails';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const filename = `${dir}/${videoId}.jpg`;
            const response = await this.axios({
                method: 'GET',
                url: thumbnailUrl,
                responseType: 'stream'
            });
            
            const writer = fs.createWriteStream(filename);
            response.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filename));
                writer.on('error', reject);
            });
        } catch (error) {
            console.log(`Failed to download thumbnail for ${videoId}: ${error.message}`);
            return null;
        }
    }
    
    async extractTranscript(videoId) {
        try {
            const transcript = await this.YoutubeTranscript.fetchTranscript(videoId);
            return transcript;
        } catch (error) {
            console.log(`Failed to extract transcript for ${videoId}: ${error.message}`);
            return null;
        }
    }
    
    formatTranscriptWithTimestamps(transcript) {
        const formattedLines = transcript.map(entry => {
            const startTime = parseFloat(entry.offset);
            const text = entry.text.trim();
            
            // Convert seconds to MM:SS or HH:MM:SS format
            let timestamp;
            if (startTime >= 3600) { // 1 hour or more
                const hours = Math.floor(startTime / 3600);
                const minutes = Math.floor((startTime % 3600) / 60);
                const seconds = Math.floor(startTime % 60);
                timestamp = `(${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')})`;
            } else {
                const minutes = Math.floor(startTime / 60);
                const seconds = Math.floor(startTime % 60);
                timestamp = `(${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')})`;
            }
            
            return `${timestamp} ${text}`;
        });
        
        return formattedLines.join('\\n');
    }
    
    formatMarkdownOutput(metadata, transcriptText, includeDescription = true) {
        let markdown = `[(${metadata.title}) - YouTube](${metadata.url})\\n\\n`;
        
        // Add metadata
        markdown += `Channel: ${metadata.channel}\\n`;
        markdown += `Views: ${metadata.views}\\n\\n`;
        
        if (includeDescription && metadata.description) {
            markdown += `Description:\\n${metadata.description}\\n\\n`;
        }
        
        markdown += `Transcript:\\n${transcriptText}`;
        
        return markdown;
    }
    
    async processSingleVideo(url, includeDescription = true) {
        const videoId = this.extractVideoId(url);
        if (!videoId) {
            return { error: 'Invalid YouTube URL' };
        }
        
        console.log(`Processing video: ${videoId}`);
        
        // Get metadata
        const metadata = await this.getVideoMetadata(videoId);
        
        // Download thumbnail
        const thumbnailPath = await this.downloadThumbnail(videoId, metadata.thumbnailUrl);
        metadata.thumbnailPath = thumbnailPath;
        
        // Extract transcript
        const transcriptData = await this.extractTranscript(videoId);
        
        if (!transcriptData) {
            this.failedVideos.push({ videoId, reason: 'No transcript available' });
            return { error: 'No transcript available' };
        }
        
        // Format transcript
        const transcriptText = this.formatTranscriptWithTimestamps(transcriptData);
        
        // Create markdown output
        const markdownOutput = this.formatMarkdownOutput(metadata, transcriptText, includeDescription);
        
        const result = {
            videoId,
            metadata,
            transcriptData,
            transcriptText,
            markdownOutput
        };
        
        this.results.push(result);
        return result;
    }
    
    async exportToCsv(filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            filename = `youtube_transcripts_${timestamp}.csv`;
        }
        
        const csvData = this.results.map(result => ({
            video_id: result.metadata.videoId,
            title: result.metadata.title,
            channel: result.metadata.channel,
            views: result.metadata.views,
            description: result.metadata.description,
            transcript_text: result.transcriptText,
            url: result.metadata.url,
            thumbnail_path: result.metadata.thumbnailPath || ''
        }));
        
        const csvWriter = this.createCsvWriter({
            path: filename,
            header: [
                { id: 'video_id', title: 'Video ID' },
                { id: 'title', title: 'Title' },
                { id: 'channel', title: 'Channel' },
                { id: 'views', title: 'Views' },
                { id: 'description', title: 'Description' },
                { id: 'transcript_text', title: 'Transcript' },
                { id: 'url', title: 'URL' },
                { id: 'thumbnail_path', title: 'Thumbnail Path' }
            ]
        });
        
        await csvWriter.writeRecords(csvData);
        console.log(`CSV exported to: ${filename}`);
        return filename;
    }
    
    exportMarkdownFiles(outputDir = 'transcripts') {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const exportedFiles = [];
        
        this.results.forEach(result => {
            const videoId = result.videoId;
            const title = result.metadata.title.replace(/[^\\w\\s-]/g, '').replace(/[-\\s]+/g, '-').substring(0, 50);
            const filename = `${outputDir}/${videoId}_${title}.md`;
            
            fs.writeFileSync(filename, result.markdownOutput, 'utf8');
            exportedFiles.push(filename);
        });
        
        console.log(`Exported ${exportedFiles.length} markdown files to ${outputDir}/`);
        return exportedFiles;
    }
}

// CLI Interface
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    const extractor = new YouTubeTranscriptExtractor();
    
    console.log('YouTube Transcript Extractor - Node.js Version');
    console.log('=' .repeat(50));
    
    while (true) {
        console.log('\\nOptions:');
        console.log('1. Extract single video transcript');
        console.log('2. Export results to CSV');
        console.log('3. Export markdown files');
        console.log('4. Exit');
        
        const choice = await question('\\nSelect option (1-4): ');
        
        switch (choice.trim()) {
            case '1':
                const url = await question('Enter YouTube video URL or ID: ');
                const includeDesc = (await question('Include description? (y/n, default y): ')).trim().toLowerCase() !== 'n';
                
                const result = await extractor.processSingleVideo(url.trim(), includeDesc);
                
                if (result.error) {
                    console.log(`Error: ${result.error}`);
                } else {
                    console.log('\\nMarkdown Output:');
                    console.log('-'.repeat(40));
                    console.log(result.markdownOutput);
                    
                    // Option to save to file
                    const saveChoice = await question('\\nSave to file? (y/n): ');
                    if (saveChoice.trim().toLowerCase() === 'y') {
                        const filename = `${result.videoId}_transcript.md`;
                        fs.writeFileSync(filename, result.markdownOutput, 'utf8');
                        console.log(`Saved to: ${filename}`);
                    }
                }
                break;
                
            case '2':
                if (extractor.results.length === 0) {
                    console.log('No results to export. Process some videos first.');
                    break;
                }
                
                const csvFilename = await question('CSV filename (default: auto-generated): ');
                await extractor.exportToCsv(csvFilename.trim() || null);
                break;
                
            case '3':
                if (extractor.results.length === 0) {
                    console.log('No results to export. Process some videos first.');
                    break;
                }
                
                const outputDir = await question('Output directory (default: transcripts): ');
                extractor.exportMarkdownFiles(outputDir.trim() || 'transcripts');
                break;
                
            case '4':
                console.log('Goodbye!');
                rl.close();
                return;
                
            default:
                console.log('Invalid option. Please try again.');
        }
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = YouTubeTranscriptExtractor;
'''

# Save the Node.js script
with open('youtube_transcript_extractor.js', 'w', encoding='utf-8') as f:
    f.write(nodejs_script)

print("Created Node.js YouTube transcript extractor: youtube_transcript_extractor.js")
print("\nTo use the Node.js version:")
print("1. npm install youtube-transcript axios csv-writer")
print("2. node youtube_transcript_extractor.js")