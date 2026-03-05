# TeleX (TLX) - Vercel Deployment Guide

This application is optimized for deployment on **Vercel**.

## 🚀 Deployment Steps

1.  **Push to GitHub**: Push your code to a GitHub repository.
2.  **Import to Vercel**: Go to [Vercel](https://vercel.com) and import your repository.
3.  **Configure Environment Variables**:
    *   Add `GEMINI_API_KEY` (if using Gemini features).
    *   Add any other custom variables you've defined.
4.  **Deploy**: Vercel will automatically detect the configuration and deploy the app.

## 🛠️ Vercel-Friendly Features Included:

*   **Serverless API**: The backend is located in `api/index.ts` and is automatically handled by Vercel as a serverless function.
*   **SPA Routing**: `vercel.json` is configured to handle client-side routing, so refreshing the page on `/tasks` or `/games` won't result in a 404.
*   **SQLite Persistence**: The app uses `/tmp/telex.db` when running on Vercel. 
    *   **Note**: Vercel's filesystem is ephemeral. Data will be reset on every redeploy or function restart.
    *   **Recommendation**: For production data persistence, connect to a cloud database like **Supabase**, **Neon**, or **Vercel Postgres**.

## ❓ Troubleshooting Deployment

### "npm warn deprecated" messages
These are **warnings**, not errors. They are common in modern web development and **will not** prevent your site from deploying. You can safely ignore them.

### "Detected engines: { node: 20.x }" warning
This is a standard Vercel notification. I have pinned the version to `20.x` to ensure stability. It is not an error.

### Build Fails?
If the build actually fails (red text at the bottom), check:
1.  **Environment Variables**: Did you add `GEMINI_API_KEY` in Vercel?
2.  **Framework Preset**: Is it set to **Vite** in Vercel settings?
3.  **Logs**: Look for the first line that starts with `Error:` above the final failure message.

## 📦 Scripts

*   `npm run dev`: Start development server (Express + Vite).
*   `npm run build`: Build the frontend for production.
*   `npm start`: Start the production server (for local testing).
