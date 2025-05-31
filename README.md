# 🎬 YouTube Transcript Extractor Pro

A comprehensive web application for extracting YouTube video transcripts with advanced features including playlist processing, real-time metadata, and bulk operations.

## ✨ Features

- **Real Transcript Extraction**: Extract actual YouTube transcripts using `youtube-transcript-api`
- **Enhanced Metadata**: Get real views, likes, comments, thumbnails using YouTube Data API v3
- **Playlist Processing**: Extract from entire playlists with progress tracking
- **Bulk Operations**: Process multiple videos simultaneously with duplicate detection
- **Multiple View Modes**: Stitched paragraphs, collapsible sections, or raw lines
- **Export Options**: Download as Markdown, TXT, CSV, JSON, or ZIP
- **BYOI Support**: Bring Your Own API key for unlimited processing
- **Download History**: Track and manage all extracted transcripts
- **Advanced Settings**: Customize display, timestamps, and processing behavior

## 🚀 Live Demo

- **Frontend**: [https://yourusername.github.io/youtube-transcript-extractor](https://yourusername.github.io/youtube-transcript-extractor)
- **Backend**: [https://your-backend.railway.app](https://your-backend.railway.app) (or your preferred hosting)

## 🏗️ Architecture

- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Backend**: Flask + youtube-transcript-api + YouTube Data API v3
- **Deployment**: Frontend on GitHub Pages, Backend on Railway/Render/Vercel

## 📋 Prerequisites

- YouTube Data API v3 key (optional, for enhanced metadata)
- Python 3.9+ (for backend)
- Git for deployment

## 🔧 Local Development

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/youtube-transcript-extractor.git
cd youtube-transcript-extractor

# Serve frontend locally
python3 -m http.server 8000
# Open http://localhost:8000
```

### Backend Setup
```bash
# Install dependencies
pip install flask flask-cors youtube-transcript-api requests python-dotenv

# Set environment variables (create .env file)
YOUTUBE_API_KEY=your_youtube_api_key_here
PORT=5001

# Run backend
python app.py
# Backend runs on http://localhost:5001
```

## 🌐 Deployment

### Frontend Deployment (GitHub Pages)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch, "/ (root)" folder
   - Save

3. **Configure Backend URL**:
   - Update backend URL in Settings tab to your hosted backend

### Backend Deployment Options

#### Option 1: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway add
railway deploy
```

#### Option 2: Render
1. Connect your GitHub repository
2. Create new Web Service
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `python app.py`
5. Add environment variables

#### Option 3: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Create `.env` file for local development:
```env
YOUTUBE_API_KEY=your_youtube_api_key_here
PORT=5001
CORS_ORIGINS=https://yourusername.github.io
```

For production deployment, set these in your hosting platform.

## 🔑 Getting YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable YouTube Data API v3
4. Create credentials → API Key
5. Restrict the key to YouTube Data API v3

## 📁 Project Structure

```
youtube-transcript-extractor/
├── index.html              # Main frontend application
├── app.py                  # Flask backend server
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (local)
├── .gitignore             # Git ignore file
├── README.md              # This file
├── netlify.toml           # Netlify configuration (optional)
└── vercel.json            # Vercel configuration (optional)
```

## 🔧 Configuration

### Frontend Configuration
Update backend URL in the application:
```javascript
// In index.html, update this line:
let BACKEND_API_BASE = 'https://your-backend-url.com/api';
```

### Backend Configuration
Environment variables in `.env`:
```env
YOUTUBE_API_KEY=your_api_key
PORT=5001
CORS_ORIGINS=https://yourusername.github.io,http://localhost:8000
```

## 🎯 Usage

1. **Single Video**: Enter YouTube URL and extract transcript
2. **Bulk Processing**: Enter multiple URLs (one per line)
3. **Playlist**: Enter playlist URL for bulk extraction
4. **Settings**: Configure API key, display options, and behavior
5. **Export**: Download in various formats or copy to clipboard

## 🔍 Features in Detail

### Transcript Views
- **Stitched Paragraphs**: Combined lines for better readability
- **Collapsible Sections**: Expandable paragraph groups
- **Raw Lines**: Individual transcript lines with timestamps

### Export Options
- **Markdown**: With clickable timestamps and metadata
- **TXT**: Plain text transcripts
- **CSV**: Structured data for analysis
- **JSON**: Machine-readable format
- **ZIP**: Bulk download of all files

### Advanced Features
- **Duplicate Detection**: Automatically detect and skip processed videos
- **Timestamp Toggle**: Include/exclude timestamps in exports
- **Filter Results**: View successful, failed, or duplicate extractions
- **History Management**: Track and manage all extractions

## 🚦 Rate Limits

- **YouTube Data API**: 10,000 units/day (free tier)
  - Single video: ~3 units
  - Playlist: ~50 units
- **Transcript Extraction**: No API limits (server-side processing)

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Failed**:
   - Check if backend is running
   - Verify backend URL in settings
   - Check CORS configuration

2. **API Rate Limit Exceeded**:
   - Use your own YouTube API key
   - Reduce batch processing size

3. **Transcript Not Found**:
   - Video may not have transcripts
   - Try different language settings
   - Check if video is private/deleted

### Debug Mode
Open browser console (F12) to see detailed error messages.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m "Add new feature"`
4. Push to branch: `git push origin feature/new-feature`
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [youtube-transcript-api](https://github.com/jdepoix/youtube-transcript-api) for transcript extraction
- [YouTube Data API v3](https://developers.google.com/youtube/v3) for metadata
- [JSZip](https://stuk.github.io/jszip/) for client-side ZIP generation

## 📞 Support

- Create an [Issue](https://github.com/yourusername/youtube-transcript-extractor/issues)
- Check [Documentation](https://github.com/yourusername/youtube-transcript-extractor/wiki)
- Email: your.email@example.com

---

Made with ❤️ for content creators and researchers 