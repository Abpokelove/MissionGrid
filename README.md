# MissionGrid

MissionGrid is a cinematic full-stack project and task management platform where projects become **Missions**, tasks become **Objectives**, team members become **Crew**, health score becomes **Core Stability**, deadline risks become **Comet Alerts**, and blockers become **Asteroid Blocks**.

## Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion
- Backend: Node.js + Express + MongoDB Atlas + Mongoose
- Auth: JWT + bcrypt
- Deployment: Vercel frontend + Render backend

## Demo Credentials

After running the seed script:

```txt
captain@missiongrid.io
mission123
```

## Local Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure backend

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://missiongrid_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/missiongrid?retryWrites=true&w=majority
JWT_SECRET=missiongrid_super_secret_2026
NODE_ENV=development
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
```

### 3. Configure frontend

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed demo data

```bash
cd server
npm run seed
```

### 5. Run project

From root:

```bash
npm run dev
```

Or separately:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

## MongoDB Atlas Quick Setup

1. Create a free/shared cluster.
2. Provider: AWS.
3. Region: Mumbai `ap-south-1`.
4. Database Access → Add database user.
5. Network Access → Add current IP. For quick Render/Vercel demo, `0.0.0.0/0` works, but use strong credentials.
6. Connect → Drivers → Node.js → copy URI.
7. Add `/missiongrid` before `?retryWrites=true` in the URI.

## Important UI Fixes Included

- Dashboard no longer blanks when backend is offline; it shows demo fallback data.
- Orbit View no longer uses rectangular orbit image blocks; it uses clean CSS orbit rings and cinematic node animation.
- Comet/asteroid/planet assets are used as overlays, alerts, and interactive mission visuals.
- Voice command stays as a modal from the topbar.
- Workload page includes graceful fallback data.
- Production build passes with `npm run build` in the client.

## Build Check

```bash
cd client
npm run build
```
