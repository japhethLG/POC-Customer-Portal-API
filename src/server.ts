import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { applySecurity } from './middleware/security.middleware';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import { requestLogger } from './middleware/requestLogger.middleware';
import { logger } from './utils/logger';

class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.errorHandling();
  }

  private config(): void {
    // 1. Security middleware (MUST BE FIRST)
    applySecurity(this.app);

    // 2. Rate limiting
    this.app.use('/api', apiRateLimiter);

    // 3. Body parser (with size limits)
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 4. CORS
    this.app.use(
      cors({
        origin: config.frontendUrl,
        credentials: true,
      })
    );

    // 5. Request logging
    this.app.use(requestLogger);
  }

  private routes(): void {
    // Mount API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'ServiceM8 Customer Portal API',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          bookings: '/api/bookings',
          messages: '/api/messages/:jobId',
        },
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    });
  }

  private errorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to MongoDB
      await connectDatabase();

      // Start server
      this.app.listen(config.port, () => {
        // logger.info('');
        // logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        // logger.info('🚀 ServiceM8 Customer Portal API');
        // logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        // logger.info(`📡 Server running on: http://localhost:${config.port}`);
        // logger.info(`🌍 Environment: ${config.nodeEnv}`);
        // logger.info(`🔗 Frontend URL: ${config.frontendUrl}`);
        // logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        // logger.info('');
        // logger.info('Available endpoints:');
        // logger.info(`  GET    /api/health`);
        // logger.info(`  POST   /api/auth/register`);
        // logger.info(`  POST   /api/auth/login`);
        // logger.info(`  POST   /api/auth/logout`);
        // logger.info(`  GET    /api/auth/me`);
        // logger.info(`  GET    /api/bookings`);
        // logger.info(`  GET    /api/bookings/:id`);
        // logger.info(`  POST   /api/jobs`);
        // logger.info(`  PUT    /api/jobs/:id`);
        // logger.info(`  DELETE /api/jobs/:id`);
        // logger.info(`  GET    /api/messages/:jobId`);
        // logger.info(`  POST   /api/messages/:jobId`);
        // logger.info('');
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new Server();
server.start();

