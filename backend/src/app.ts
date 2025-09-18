import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { testConnection } from './services/database.js';

const app = express();

// Core middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/', router);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

export default app;


// Test DB connection at startup (non-blocking but logged)
(async () => {
  try {
    await testConnection(3, 500);
    logger.info('Database connection OK');
  } catch {
    logger.error('Database connection not available at startup');
  }
})();


