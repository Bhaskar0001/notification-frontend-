# Notification System — Frontend Application

React 19 + TypeScript + Vite + Tailwind CSS frontend interface for managing automated notification triggers, channel templates, delivery audit logs, and user profile preferences.

## Features
- **Admin Dashboard**: Real-time delivery statistics and recent activity.
- **Notification Matrix Table**: Unified management of triggers (Login, Logout, Inactive) and channels (WhatsApp, Email, Web Push).
- **Template Modal**: Dynamic variable insertion (`{{user.first_name}}`, `{{event.time}}`), inline test sends, and channel toggles.
- **Web Push Integration**: Browser opt-in with OneSignal service workers.

## Local Setup
```bash
npm install
npm run dev
```

## Production Deployment (Vercel)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: URL to your live Django API (e.g. `https://your-backend.onrender.com/api`)
  - `VITE_ONESIGNAL_APP_ID`: `756275c6-1c4f-4ed3-82e2-fad9a79f0b06`
