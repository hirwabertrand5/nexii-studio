# Production Env for Vercel + Render

Use these values for a split deployment:

- Frontend on Vercel
- Backend on Render
- Persistent uploads stored on Render disk

## Vercel Frontend

Set these in the Vercel project environment variables:

```env
VITE_API_URL=https://nexii-studio-api.onrender.com
VITE_GOOGLE_CLIENT_ID=540314344768-8v68ijf4hf39tue2vqj2kk4dddsboam6.apps.googleusercontent.com
VITE_STRIPE_PUBLIC_KEY=pk_test_51TrGwIHIcFa23L5rRKNYQ7SU9f6ua2fLwGVDqsXPYAWSGFh6pKLLHKdJhat6YteC0idGncPxncbiRkfHgCy6jTMz00SVZ2Pjuo
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

## Render Backend

Set these in the Render service environment variables:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://nexii_user:YOUR_STRONG_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/nexii_studio?retryWrites=true&w=majority
JWT_SECRET=YOUR_SECURE_32_CHARACTER_SECRET_KEY_MIN_32_CHARS_LONG_AND_RANDOM
DOWNLOAD_TOKEN_SECRET=YOUR_DOWNLOAD_TOKEN_SECRET

# Frontend and CORS
FRONTEND_URL=https://YOUR-VERCEL-FRONTEND.vercel.app
CORS_ORIGIN=https://nexii-studio-vv9k-vert.vercel.app

# Google auth verification on the server
GOOGLE_CLIENT_ID=540314344768-8v68ijf4hf39tue2vqj2kk4dddsboam6.apps.googleusercontent.com

# Cookies for cross-site auth between Vercel and Render
AUTH_COOKIE_SAME_SITE=none
AUTH_COOKIE_SECURE=true

# Uploads
UPLOADS_DIR=/var/data/uploads
PRIVATE_UPLOADS_DIR=/var/data/private-uploads
PUBLIC_UPLOAD_BASE_URL=https://nexii-studio-api.onrender.com

# Admin
ADMIN_EMAIL=admin@nexii-studio.com
```

## Render Disk

Attach a persistent disk to the Render backend and mount it at:

```env
/var/data
```

That makes uploaded plan images survive restarts and redeploys.

## Google Cloud Console

For the Google OAuth client:

- Add your Vercel domain under authorized JavaScript origins
- Add `http://localhost:3001` and `http://localhost:5173` for local testing if needed
- Keep the client as a Web application

For the current popup Google login flow, you do not need a redirect URI for the buyer login.
