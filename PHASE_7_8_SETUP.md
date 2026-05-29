# Phase 7 & Phase 8 Implementation Guide

## ✅ Completed Implementation

### Phase 7: Custom Architectural Design Workflow

**Backend models** (`/server/src/models/`):
- `CustomRequest.ts` — Full enterprise schema with 8 statuses, project types, file uploads, quotations, timeline tracking, client-admin messaging
- `AdminActivityLog.ts` — Audit trail for all admin actions

**Backend API endpoints** (`/server/src/controllers/` & `/server/src/routes/`):

*Client-facing requests* (`GET /api/requests/`):
- `POST /api/requests/` — Create new custom request
- `GET /api/requests/mine` — Fetch user's requests with pagination
- `GET /api/requests/:id` — View request details (ownership validated)
- `POST /api/requests/:id/files` — Upload files (multer + Cloudinary/S3)
- `POST /api/requests/:id/quotation/respond` — Client accepts/rejects/revises quotation
- `POST /api/requests/:id/messages` — Add client message to request
- `GET /api/requests/:id/timeline` — View project timeline/progress

*Admin management* (`GET /api/admin/requests/`):
- `GET /api/admin/requests/` — List all requests with filtering
- `GET /api/admin/requests/statistics/all` — Request status breakdown
- `GET /api/admin/requests/:id` — View request with client info
- `PUT /api/admin/requests/:id/status` — Update request status (8 valid statuses)
- `POST /api/admin/requests/:id/quotation` — Send quotation with pricing/timeline
- `PUT /api/admin/requests/:id/notes` — Add admin notes

**File upload service** (`/server/src/services/fileUploadService.ts`):
- Dual-provider strategy: Cloudinary for images, S3 for documents
- Fallback to Cloudinary if S3 not configured
- Multer memory storage + buffer streaming
- File type categorization (sketch, document, inspiration, other)
- Environment-based provider selection

**Middleware** (`/server/src/middleware/uploadMiddleware.ts`):
- Multer configuration: memory storage, 20 MB per file, 12 files max
- Express file handling via `req.files`

### Phase 8: Premium UI/UX & Visual Identity

**Design system** (`/src/styles/`):
- `design-tokens.css` — Architectural color palette (deep blue, greys, warm accent), typography scale, spacing scale, elevation (shadows), border radius utilities
- Global utility classes (`.nexii-card`, `.nexii-hero`, `.nexii-badge-primary`)

**Animation provider** (`/src/shared/ui/MotionProvider.tsx`):
- Framer Motion integration for smooth page transitions
- Page transition variants (opacity + Y-axis animation, 0.36s duration)
- Wrapped app at root (`/src/main.tsx`) with `AnimatePresence`

---

## 🔧 Setup Instructions

### Environment Setup

Update `/server/.env` with valid credentials:

```env
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/nexii-studio
JWT_SECRET=your-secure-jwt-secret-key

# File upload - Cloudinary (optional, preferred for images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# File upload - AWS S3 (optional, for documents)
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Optional: Paystack & Flutterwave (payment gateways)
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
FLUTTERWAVE_PUBLIC_KEY=...
FLUTTERWAVE_SECRET_KEY=...
```

### MongoDB Setup

**Option 1: MongoDB Atlas (Cloud - Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create database user and get connection string
4. Update `MONGO_URI` in `.env`

**Option 2: Local MongoDB (Development)**
```bash
# macOS (via Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu/Debian)
sudo apt-get install -y mongodb
sudo systemctl start mongodb

# Then use:
# MONGO_URI=mongodb://localhost:27017/nexii-studio
```

### Install Dependencies

```bash
# Install server packages
cd server
pnpm install

# Install frontend packages (from root)
cd ..
pnpm install
```

### Running the Development Environment

```bash
# Terminal 1: Backend server (from /server directory)
cd server
pnpm run dev

# Terminal 2: Frontend dev server (from root directory)
pnpm run dev
```

The backend will start on `http://localhost:5000` and frontend on `http://localhost:5173` (Vite default).

---

## 📋 Testing the Custom Request API

### 1. Authentication (Required for all requests)

**Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Architect",
    "email": "john@example.com",
    "password": "SecurePass123",
    "country": "Nigeria"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

Response will include `token` — use this in all subsequent requests.

### 2. Create Custom Request

```bash
curl -X POST http://localhost:5000/api/requests/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "projectTitle": "Modern Lagos Residential Complex",
    "projectType": "residential",
    "plotSize": 2500,
    "bedrooms": 5,
    "bathrooms": 3,
    "floors": 3,
    "budget": 250000,
    "budgetCurrency": "USD",
    "country": "Nigeria",
    "location": "Ikoyi, Lagos",
    "architecturalStyle": "contemporary-african",
    "description": "A premium residential complex with modern amenities",
    "functionalRequirements": ["home-office", "gym", "entertainment-room"],
    "inspirationPreferences": ["sustainable-design", "natural-lighting"]
  }'
```

### 3. Upload Files to Request

```bash
# Using a request ID from the previous response
REQUEST_ID="your_request_id"

curl -X POST http://localhost:5000/api/requests/$REQUEST_ID/files \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "files=@/path/to/plot-sketch.pdf" \
  -F "files=@/path/to/inspiration.jpg"
```

### 4. View My Requests

```bash
curl -X GET "http://localhost:5000/api/requests/mine?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. View Request Details

```bash
curl -X GET http://localhost:5000/api/requests/$REQUEST_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Add Message to Request

```bash
curl -X POST http://localhost:5000/api/requests/$REQUEST_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "message": "Can you provide more details on the design style?"
  }'
```

---

## 🔐 File Upload Security Features

✅ **File size limits:** 20 MB per file  
✅ **File type categorization:** Automatic detection (sketch, document, inspiration, other)  
✅ **Storage key tracking:** Cloudinary (`cloudinary://public_id`) or S3 (`s3://key`)  
✅ **Ownership validation:** Users can only access/upload to their own requests  
✅ **Provider fallback:** S3 → Cloudinary if either unavailable

---

## 🎨 Design Tokens Usage in Components

```tsx
// Using design tokens in new components
import "@/styles/design-tokens.css";

export function MyCard() {
  return (
    <div className="nexii-card" style={{ padding: 'var(--space-5)' }}>
      <h2 style={{ color: 'var(--color-architectural-blue)', fontSize: 'var(--text-2xl)' }}>
        Premium Design
      </h2>
      <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-base)' }}>
        Built with NEXii design tokens
      </p>
    </div>
  );
}
```

---

## 📱 Next Phase Tasks

1. **Build multi-step form** — 5-step custom request submission form with progress indicator
2. **Client dashboard** — View requests, track progress, see quotations
3. **Request details page** — Full project information, file management, quotation responses
4. **Premium components** — Refactor Nav, Hero, PlanCard with animations and mobile optimization
5. **Image optimization** — Lazy loading, responsive images, compression
6. **Performance** — Code splitting, skeleton loaders, API optimization
7. **Accessibility & SEO** — ARIA labels, dynamic meta tags, structured data

---

## 🚀 Build & Deploy

**Build for production:**
```bash
# Backend
cd server
pnpm run build
# Output: dist/ directory with compiled JS

# Frontend
pnpm run build
# Output: dist/ directory with optimized bundles
```

**Run production server:**
```bash
cd server
node dist/server.js
```

---

## 📞 Support Notes

- **TypeScript build:** All errors fixed ✅
- **API endpoints:** All wired and ready for testing
- **File upload:** Requires valid Cloudinary API key or S3 credentials
- **Database:** Requires valid MongoDB connection string
- **Design system:** Ready to extend with new component implementations

---

**Implementation Date:** May 21, 2026  
**Status:** Phase 7 & Phase 8 Foundation Complete | Ready for Component & Feature Development
