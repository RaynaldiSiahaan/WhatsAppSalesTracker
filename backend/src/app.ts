import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler'; // Import the error handler
import { env } from './config/env';

const app = express();

// Middleware
app.use(cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use(routes);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Global Error Handler - Must be last
app.use(errorHandler);

export default app;
