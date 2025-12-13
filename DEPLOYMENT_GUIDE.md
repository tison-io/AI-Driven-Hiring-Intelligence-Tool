# Deployment Guide

## CI/CD Pipeline Overview

This project uses **GitHub Actions** for automated testing and deployment.

### Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every PR and push
   - Tests backend, frontend, and AI service
   - Validates builds

2. **Deploy Pipeline** (`.github/workflows/deploy.yml`)
   - Runs on merge to `main`
   - Deploys to production

3. **Docker Build** (`.github/workflows/docker-build.yml`)
   - Builds Docker images
   - Pushes to GitHub Container Registry

---

## Recommended Deployment Stack

### Option 1: Simple & Free (Recommended for MVP)

| Service | Platform | Cost |
|---------|----------|------|
| Backend | Render | Free tier |
| Frontend | Vercel | Free tier |
| AI Service | Render | Free tier |
| Database | MongoDB Atlas | Free tier (512MB) |
| Redis | Upstash | Free tier |

**Total Cost: $0/month**

### Option 2: Production-Ready

| Service | Platform | Cost |
|---------|----------|------|
| Backend | AWS ECS/Fargate | ~$15-30/month |
| Frontend | Vercel Pro | $20/month |
| AI Service | AWS Lambda | Pay per use |
| Database | MongoDB Atlas M10 | $57/month |
| Redis | AWS ElastiCache | ~$15/month |

**Total Cost: ~$107-122/month**

---

## Setup Instructions

### 1. Backend Deployment (Render)

1. Go to [render.com](https://render.com) and sign up
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `hiring-tool-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/main`
   - **Environment**: Node

5. Add Environment Variables:
   ```
   DATABASE_URL=<your-mongodb-atlas-url>
   JWT_SECRET=<generate-secure-secret>
   JWT_EXPIRES_IN=7d
   REDIS_HOST=<upstash-redis-host>
   REDIS_PORT=<upstash-redis-port>
   REDIS_PASSWORD=<upstash-redis-password>
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
   CLOUDINARY_API_KEY=<your-cloudinary-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-secret>
   RAPIDAPI_KEY=<your-rapidapi-key>
   AI_SERVICE_URL=<your-ai-service-url>
   NODE_ENV=production
   PORT=3000
   ```

6. Click **Create Web Service**

### 2. Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=<your-backend-url>
   ```

6. Click **Deploy**

### 3. AI Service Deployment (Render)

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `hiring-tool-ai-service`
   - **Root Directory**: `AI_Backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
   - **Environment**: Python 3

5. Add Environment Variables:
   ```
   OPENAI_API_KEY=<your-openai-key>
   GROQ_API_KEY=<your-groq-key>
   ```

6. Click **Create Web Service**

### 4. Database Setup (MongoDB Atlas)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string and add to backend env vars

### 5. Redis Setup (Upstash)

1. Go to [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy connection details to backend env vars

---

## GitHub Secrets Setup

Add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

```
RENDER_DEPLOY_HOOK_BACKEND=<render-deploy-hook-url>
RENDER_DEPLOY_HOOK_AI=<render-deploy-hook-url>
VERCEL_TOKEN=<vercel-deployment-token>
```

---

## Deployment Workflow

### Automatic Deployment

1. Push code to `main` branch
2. GitHub Actions runs tests
3. If tests pass, deploys to production
4. Vercel auto-deploys frontend
5. Render deploys backend and AI service

### Manual Deployment

```bash
# Trigger deployment manually
gh workflow run deploy.yml
```

---

## Environment Variables Checklist

### Backend
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- [ ] CLOUDINARY credentials
- [ ] RAPIDAPI_KEY
- [ ] AI_SERVICE_URL

### Frontend
- [ ] NEXT_PUBLIC_API_URL

### AI Service
- [ ] OPENAI_API_KEY
- [ ] GROQ_API_KEY

---

## Monitoring & Logs

### Render
- View logs: Dashboard → Service → Logs
- Metrics: Dashboard → Service → Metrics

### Vercel
- View logs: Dashboard → Project → Deployments → Logs
- Analytics: Dashboard → Project → Analytics

---

## Rollback Strategy

### Render
1. Go to Dashboard → Service
2. Click **Rollback** on previous deployment

### Vercel
1. Go to Dashboard → Project → Deployments
2. Click **...** on previous deployment → **Promote to Production**

---

## Health Checks

Add these endpoints to monitor service health:

- Backend: `https://your-backend.onrender.com/health`
- AI Service: `https://your-ai-service.onrender.com/health`
- Frontend: `https://your-frontend.vercel.app`

---

## Cost Optimization Tips

1. **Use free tiers** for development/staging
2. **Enable auto-scaling** only for production
3. **Use CDN** for static assets (Vercel does this automatically)
4. **Monitor usage** to avoid unexpected charges
5. **Set up billing alerts** on all platforms

---

## Troubleshooting

### Backend won't start
- Check environment variables
- Verify MongoDB connection string
- Check Redis connection

### Frontend build fails
- Verify NEXT_PUBLIC_API_URL is set
- Check for TypeScript errors locally

### AI Service errors
- Verify API keys are set
- Check Python dependencies

---

## Next Steps

1. ✅ Set up CI/CD pipelines (Done)
2. ⬜ Deploy to staging environment
3. ⬜ Test all features in staging
4. ⬜ Deploy to production
5. ⬜ Set up monitoring and alerts
6. ⬜ Configure custom domain
7. ⬜ Set up SSL certificates (automatic on Vercel/Render)

---

## Support

For deployment issues:
- Render: [render.com/docs](https://render.com/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- MongoDB Atlas: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
