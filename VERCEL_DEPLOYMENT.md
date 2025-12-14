# Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Backend API deployed and accessible

---

## Step 1: Prepare Repository

Ensure these files exist in `frontend/`:
- ✅ `vercel.json` - Vercel configuration
- ✅ `.vercelignore` - Files to exclude
- ✅ `next.config.js` - Next.js configuration
- ✅ `.env.example` - Environment variables template

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Click "Add New" → "Project"**

3. **Import your GitHub repository**
   - Select your repository
   - Click "Import"

4. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

5. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-api.com
   ```
   Replace with your actual backend URL

6. **Click "Deploy"**
   - Vercel will build and deploy your app
   - Wait 2-3 minutes for deployment

7. **Get Your URL**
   - Vercel provides: `https://your-app.vercel.app`
   - You can add a custom domain later

---

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? hiring-intelligence-frontend
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

---

## Step 3: Configure Environment Variables

### In Vercel Dashboard:

1. Go to your project
2. Click "Settings" → "Environment Variables"
3. Add:

```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

**Important:** 
- Use your production backend URL
- Must start with `NEXT_PUBLIC_` to be accessible in browser
- Redeploy after adding variables

---

## Step 4: Enable Auto-Deploy

Vercel automatically deploys when you push to GitHub:

- **Push to `main`** → Deploys to production
- **Push to other branches** → Creates preview deployment
- **Pull requests** → Creates preview deployment

---

## Step 5: Custom Domain (Optional)

1. Go to project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Vercel handles SSL automatically

---

## Environment Variables Reference

### Required:
```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

### Optional:
```env
NEXT_PUBLIC_APP_NAME=Hiring Intelligence Tool
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
```

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure `npm run build` works locally
- Verify all environment variables are set

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS settings allow Vercel domain
- Ensure backend is accessible from internet

### Environment Variables Not Working
- Must start with `NEXT_PUBLIC_` for client-side
- Redeploy after adding/changing variables
- Check spelling and format

---

## Backend CORS Configuration

Update your backend to allow Vercel domain:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3001',
    'https://your-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true,
});
```

---

## Deployment Checklist

- [ ] Frontend builds successfully locally
- [ ] Environment variables configured in Vercel
- [ ] Backend API is deployed and accessible
- [ ] Backend CORS allows Vercel domain
- [ ] Test deployment URL works
- [ ] All features functional on production

---

## Useful Commands

```bash
# Test build locally
npm run build
npm start

# Check environment variables
vercel env ls

# View deployment logs
vercel logs

# Rollback to previous deployment
vercel rollback
```

---

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Vercel Support: https://vercel.com/support

---

**Your frontend is now ready for Vercel deployment! 🚀**
