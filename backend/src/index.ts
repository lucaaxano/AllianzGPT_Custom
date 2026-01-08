import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import chatRoutes from './routes/chat.routes';
import openaiRoutes from './routes/openai.routes';

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://frontend:3000',
  'https://gpt.sena-n8n.de',
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api', openaiRoutes);

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
