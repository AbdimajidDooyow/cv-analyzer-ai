<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/936ef76e-98ed-4e9e-8d41-25f5de1481e6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy on Vercel

This app is configured for Vercel with a serverless API handler in [api/index.ts](api/index.ts) and routing in [vercel.json](vercel.json).

1. Set production env vars in Vercel: `GEMINI_API_KEY`, `MONGO_URI`, `JWT_SECRET`, and optionally `MONGO_DB_NAME`
2. Push the repo to GitHub and import it into Vercel
3. Keep the build command as `npm run build`
4. Keep the output as the default Vite `dist` folder

The frontend is served from the static build output and `/api/*` is routed to the serverless function.

If `/api/auth/signup` returns a 503, it usually means `MONGO_URI` is missing or the MongoDB Atlas cluster is not reachable from Vercel.

If you see a Vercel `FUNCTION_INVOCATION_FAILED` on signup, increase the function duration as configured in [vercel.json](vercel.json) and confirm Atlas network access allows Vercel to connect.
