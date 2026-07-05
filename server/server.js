const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MissionGrid API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/invites', require('./routes/inviteRoutes'));
app.use('/api/workspace', require('./routes/workspaceRoutes'));
app.use('/api/missions', require('./routes/missionRoutes'));
app.use('/api/objectives', require('./routes/objectiveRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`MissionGrid server running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the old Node process or set PORT=5001 in server/.env.`);
    process.exit(1);
  }
  throw error;
});
