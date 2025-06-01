# 🎬 YouTube Transcript Extractor & URL Metadata Tools

A comprehensive suite of tools for extracting YouTube transcripts, URL metadata, and Reddit content with enhanced functionality and modern UI.

## 📁 Project Structure

```
exported-assets (2)/
├── frontend/           # All web interfaces
│   ├── index.html                 # Main YouTube transcript extractor
│   ├── simple_extractor.html      # Simple URL metadata extractor
│   ├── reddit_downloader.html     # Standalone Reddit downloader
│   ├── debug_frontend.html        # Debug and testing tools
│   └── [other HTML files]         # Legacy versions
├── backend/            # Server-side components
│   ├── app.py                     # Flask backend server
│   ├── real_transcript_extractor.py
│   └── youtube_transcript_extractor.py
├── scripts/            # Utility scripts
│   ├── script.py
│   ├── script_1.py
│   ├── chart_script.py
│   └── youtube_transcript_extractor.js
├── tests/              # Test files
│   ├── test_all_urls_local.py
│   ├── test_frontend_urls.js
│   └── [other test files]
├── config/             # Configuration files
│   ├── requirements.txt
│   ├── netlify.toml
│   ├── railway.toml
│   └── vercel.json
├── docs/               # Documentation
│   ├── README.md
│   ├── DEPLOYMENT.md
│   ├── URL_CONVERTER_DEMO.md
│   └── [other documentation]
└── assets/             # Images and data
    ├── generated_image.png
    ├── url_test_results.json
    └── [other assets]
```

## 🚀 Quick Start

### 1. Frontend Server (Port 8000)
```bash
cd frontend
python3 -m http.server 8000
```

### 2. Backend Server (Port 5002)
```bash
cd backend
pip install -r ../config/requirements.txt
python3 app.py
```

### 3. Access the Tools
- **Main YouTube App**: http://localhost:8000/frontend/
- **Simple URL Extractor**: http://localhost:8000/frontend/simple_extractor.html
- **Reddit Downloader**: http://localhost:8000/frontend/reddit_downloader.html
- **Debug Tools**: http://localhost:8000/frontend/debug_frontend.html

## 🛠️ Tools Overview

### 🎬 YouTube Transcript Extractor (Main App)
- Extract transcripts from YouTube videos
- Support for multiple languages
- Bulk processing capabilities
- Export to multiple formats (TXT, CSV, JSON, SRT)
- Real-time progress tracking

### 🔗 Simple URL Extractor
- Browser-only URL metadata extraction
- Support for YouTube, GitHub, Reddit, Twitter/X
- Bulk processing with intelligent file naming
- Compact horizontal layout for space efficiency
- Export options (TXT, CSV)

### 🔴 Reddit Downloader
- Standalone Reddit content extractor
- Comments, metadata, author info, timestamps
- Multi-strategy data fetching (JSON API, old Reddit, CORS proxy)
- Export formats: Markdown, JSON, ZIP archives
- Enhanced error handling

### 🔧 Debug Tools
- Backend connectivity testing
- URL metadata debugging
- Real-time health monitoring
- Error diagnostics

## 🎯 Key Features

- **🏗️ Organized Structure**: Clean folder organization for better maintainability
- **🔗 Cross-Tool Navigation**: Seamless navigation between all tools
- **📱 Responsive Design**: Modern UI that works on all devices
- **🚀 Multiple Export Formats**: TXT, CSV, JSON, ZIP, Markdown, SRT
- **⚡ Intelligent Processing**: Smart retry mechanisms and fallback strategies
- **📊 Progress Tracking**: Real-time progress with detailed status updates
- **🎨 Professional UI**: Modern design with gradients and animations

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd exported-assets
   ```

2. **Install dependencies**
   ```bash
   pip install -r config/requirements.txt
   ```

3. **Start the servers**
   ```bash
   # Frontend (Terminal 1)
   cd frontend && python3 -m http.server 8000
   
   # Backend (Terminal 2) 
   cd backend && python3 app.py
   ```

## 🔧 Configuration

### Backend Configuration (backend/app.py)
- **Port**: 5002 (configurable)
- **CORS**: Enabled for frontend integration
- **Rate Limiting**: Built-in throttling for API calls

### Frontend Configuration
- **Port**: 8000 (Python HTTP server)
- **Backend URL**: http://localhost:5002
- **Auto-retry**: Configurable retry mechanisms

## 📈 API Usage

### YouTube Transcript API
- **95%+ success rate** for public videos
- Automatic language detection
- Fallback strategies for restricted content

### URL Metadata Extraction
- **Multi-platform support**: YouTube, GitHub, Reddit, Twitter/X
- **Intelligent parsing** with domain-specific strategies
- **CORS-friendly** browser-only operation

### Reddit Content Extraction
- **Public JSON API** integration (no API key required)
- **Nested comment threads** with hierarchical structure
- **Configurable limits** (25/50/100/250/unlimited comments)

## 🚢 Deployment

The project supports multiple deployment platforms:

- **Netlify**: Use `config/netlify.toml`
- **Railway**: Use `config/railway.toml`
- **Vercel**: Use `config/vercel.json`

See `docs/DEPLOYMENT.md` for detailed deployment instructions.

## 🧪 Testing

Run the test suite:
```bash
cd tests
python3 test_all_urls_local.py
```

## 📝 Documentation

- **Main Documentation**: `docs/README.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **URL Converter Demo**: `docs/URL_CONVERTER_DEMO.md`
- **YouTube Setup**: `docs/youtube-transcript-setup.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🛟 Support

For issues or questions:
1. Check the documentation in `docs/`
2. Use the Debug Tools for troubleshooting
3. Review the test files in `tests/`
4. Open an issue on the repository

---

**Built with ❤️ for efficient content extraction and metadata processing** 