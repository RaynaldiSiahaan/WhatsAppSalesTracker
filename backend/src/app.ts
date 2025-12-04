import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(routes);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

export default app;
