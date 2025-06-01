# 🚀 Deployment Guide - YouTube Transcript Extractor Pro

This guide will help you deploy the YouTube Transcript Extractor Pro to various platforms.

## 📁 Project Architecture

- **Frontend**: `index.html` (Pure HTML/CSS/JavaScript)
- **Backend**: `app.py` (Flask + youtube-transcript-api)
- **Deployment Strategy**: Frontend and backend deployed separately

## 🌐 Frontend Deployment Options

### Option 1: GitHub Pages (Recommended)

1. **Create GitHub Repository**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/youtube-transcript-extractor.git
git push -u origin main
```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main` / `(root)`
   - Click Save

3. **Your frontend will be live at**:
   `https://yourusername.github.io/youtube-transcript-extractor`

### Option 2: Netlify

1. **Connect Repository**:
   - Visit [netlify.com](https://netlify.com)
   - New site from Git → GitHub
   - Select your repository

2. **Build Settings**:
   - Build command: `echo "No build needed"`
   - Publish directory: `/` (root)

3. **Deploy**: Automatic on each push

### Option 3: Vercel Frontend

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel --prod
```

## 🖥️ Backend Deployment Options

### Option 1: Railway (Recommended)

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Deploy**:
```bash
railway login
railway init
railway up
```

3. **Set Environment Variables**:
```bash
railway variables set YOUTUBE_API_KEY=your_api_key_here
railway variables set FLASK_ENV=production
railway variables set CORS_ORIGINS=https://yourusername.github.io
```

### Option 2: Render

1. **Create Web Service**:
   - Connect GitHub repository
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`

2. **Environment Variables**:
   - `YOUTUBE_API_KEY`: Your YouTube API key
   - `FLASK_ENV`: `production`
   - `CORS_ORIGINS`: Your frontend URL

### Option 3: Vercel Backend

1. **Deploy**:
```bash
vercel --prod
```

2. **Add Environment Variables** in Vercel dashboard:
   - `YOUTUBE_API_KEY`
   - `FLASK_ENV=production`

### Option 4: Heroku

1. **Install Heroku CLI** and login

2. **Create app**:
```bash
heroku create your-app-name
```

3. **Set environment variables**:
```bash
heroku config:set YOUTUBE_API_KEY=your_api_key_here
heroku config:set FLASK_ENV=production
heroku config:set CORS_ORIGINS=https://yourusername.github.io
```

4. **Deploy**:
```bash
git push heroku main
```

## 🔐 Environment Variables Setup

### Required Variables:

- `YOUTUBE_API_KEY`: Your YouTube Data API v3 key
- `FLASK_ENV`: Set to `production` for production deployment
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `PORT`: Port number (usually auto-set by hosting platforms)

### Example `.env` file (for local development):
```env
YOUTUBE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLASK_ENV=development
CORS_ORIGINS=http://localhost:8000,https://yourusername.github.io
PORT=5001
```

## 🔑 Getting YouTube API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**
3. **Enable YouTube Data API v3**:
   - APIs & Services → Library
   - Search "YouTube Data API v3" → Enable
4. **Create Credentials**:
   - APIs & Services → Credentials
   - Create Credentials → API Key
5. **Restrict the Key** (recommended):
   - Edit API key → API restrictions
   - Select "YouTube Data API v3"

## 🔗 Connecting Frontend to Backend

After deploying your backend, update the frontend:

1. **Get your backend URL** (e.g., `https://your-app.railway.app`)

2. **Update frontend configuration**:
   - Go to your deployed frontend
   - Navigate to Settings tab
   - Update "Backend Configuration" with your backend URL
   - Test connection

3. **Or modify the code directly**:
```javascript
// In index.html, update this line:
let BACKEND_API_BASE = 'https://your-backend-url.com/api';
```

## 🧪 Testing Your Deployment

### 1. Test Backend Health
```bash
curl https://your-backend-url.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "YouTube Transcript Extractor API is running"
}
```

### 2. Test Frontend
- Visit your frontend URL
- Go to Settings tab
- Check backend connection status
- Try extracting a transcript

### 3. Test End-to-End
1. Extract a single video transcript
2. Try bulk processing
3. Test playlist extraction
4. Verify download functionality

## 🔧 Production Configuration

### Frontend Updates for Production:

1. **Update backend URL** in Settings tab or directly in code
2. **Add your own YouTube API key** for better rate limits
3. **Configure CORS** properly in backend

### Backend Security:

1. **Environment Variables**: Never commit API keys
2. **CORS**: Restrict to your frontend domains only
3. **Rate Limiting**: Consider adding rate limiting for production
4. **HTTPS**: Ensure your backend uses HTTPS

## 🚨 Common Issues & Solutions

### CORS Errors
- **Problem**: Frontend can't connect to backend
- **Solution**: Add frontend URL to `CORS_ORIGINS` environment variable

### API Rate Limits
- **Problem**: "Rate limit exceeded" errors
- **Solution**: Use your own YouTube API key with higher quotas

### Backend Not Responding
- **Problem**: Backend health check fails
- **Solution**: Check logs, ensure environment variables are set

### Transcript Extraction Fails
- **Problem**: "No transcript available" for videos that have them
- **Solution**: Video might be private/restricted, try different videos

## 📊 Monitoring & Logs

### Check Logs:

**Railway**: `railway logs`
**Render**: View in dashboard
**Vercel**: `vercel logs`
**Heroku**: `heroku logs --tail`

### Monitor Usage:

1. **YouTube API**: Monitor quota usage in Google Cloud Console
2. **Backend**: Check server logs for errors
3. **Frontend**: Use browser console for client-side issues

## 🔄 Updating Your Deployment

### Frontend Updates:
1. Make changes to `index.html`
2. Commit and push to GitHub
3. GitHub Pages/Netlify will auto-deploy

### Backend Updates:
1. Make changes to `app.py` or `requirements.txt`
2. Commit and push
3. Platform will auto-deploy (or manually trigger)

## 💰 Cost Estimation

### Free Tier Limits:
- **GitHub Pages**: Free for public repos
- **Netlify**: 100GB bandwidth/month free
- **Railway**: $5/month after free trial
- **Render**: Free tier available with limitations
- **Vercel**: Free tier with usage limits

### YouTube API:
- **Free**: 10,000 units/day
- **Paid**: $0.25 per 1,000 additional units

## 🆘 Support

If you encounter issues:

1. **Check logs** first
2. **Verify environment variables** are set correctly
3. **Test API endpoints** individually
4. **Check CORS configuration**
5. **Create an issue** in the GitHub repository

---

**Happy Deploying! 🚀** 