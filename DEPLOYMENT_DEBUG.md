# Deployment Debugging Guide

## Black Screen Troubleshooting

If you're seeing a black screen on deployment, follow these steps:

### 1. Check Browser Console
Open your browser's developer tools (F12) and check the Console tab for errors:
- Look for 404 errors (missing files)
- Look for JavaScript errors
- Look for CORS errors

### 2. Check Network Tab
In developer tools, go to the Network tab and refresh:
- Verify all CSS and JS files are loading (status 200)
- Check if assets have correct paths
- Look for any failed requests

### 3. Common Deployment Issues

#### Issue: API Error 500 on `/api/generate`
**Symptoms:** 
- API calls to `/api/generate` fail with 500 status
- Console shows: "Failed to load resource: the server responded with a status of 500 ()"

**Solution:** Set environment variables in Vercel:

1. Go to Vercel Project → Settings → Environment Variables
2. Add these variables:
   - `GOOGLE_API_KEY` - Your Google AI API key (NO VITE_ prefix for the API)
   - `VITE_GOOGLE_API_KEY` - Same value (for frontend)
3. Redeploy the project

**Why?** The Vercel serverless function needs `GOOGLE_API_KEY` (without VITE_ prefix), while the frontend needs `VITE_GOOGLE_API_KEY`.

#### Issue: Assets not loading (404 errors)
**Solution:** Add `base` to `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/your-repo-name/',  // For GitHub Pages
  // or
  base: './',  // For relative paths
  // ... rest of config
})
```

#### Issue: Blank page with no errors
**Possible causes:**
- JavaScript is disabled in browser
- Ad blocker is interfering
- Content Security Policy blocking scripts

#### Issue: Works locally but not in production
**Check:**
1. Environment variables - make sure VITE_ prefixed vars are set
2. API endpoints - ensure they're accessible from deployment
3. Base path - deployment may be in a subdirectory

### 4. Platform-Specific Issues

#### Vercel/Netlify
- Add `_redirects` or `vercel.json` for SPA routing
- Check build logs for errors

#### GitHub Pages
- Set correct `base` in vite.config.ts
- Ensure gh-pages branch is being deployed

#### Custom Server
- Verify server serves `index.html` for all routes
- Check file permissions
- Ensure Node.js/npm versions match

### 5. Quick Fixes

1. **Clear browser cache** - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. **Try incognito mode** - Rules out browser extensions
3. **Check mobile** - Sometimes works on mobile but not desktop (or vice versa)

### 6. Console Logs to Check

The app should log these messages:
```
Autonomous Code Wizard initializing...
Autonomous Code Wizard started successfully
```

If you don't see these, JavaScript isn't loading or executing.

### 7. Test Build Locally

```bash
npm run build
npm run preview
```

Then visit `http://localhost:4173` - if it works locally, the issue is deployment-specific.

## Current Build Info

- Build tool: Vite 7.1.12
- Framework: React 18.3.1
- Router: React Router DOM 6.30.1
- Bundle size: ~505 KB (JS) + ~62 KB (CSS)

## Error Boundary

The app now includes an error boundary. If there's a React error, you should see:
- Error message
- "Return to Home" button
- "Reload Page" button

If you see this, check the error message for clues.

## Need More Help?

1. Share browser console output
2. Share Network tab screenshot
3. Share deployment platform (Vercel, Netlify, etc.)
4. Share deployment URL for testing
