import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';

class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.errorHandling();
  }

  private config(): void {
    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    this.app.use(
      cors({
        origin: config.frontendUrl,
        credentials: true,
      })
    );

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
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
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 ServiceM8 Customer Portal API');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📡 Server running on: http://localhost:${config.port}`);
        console.log(`🌍 Environment: ${config.nodeEnv}`);
        console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('Available endpoints:');
        console.log(`  GET    /api/health`);
        console.log(`  POST   /api/auth/register`);
        console.log(`  POST   /api/auth/login`);
        console.log(`  POST   /api/auth/logout`);
        console.log(`  GET    /api/auth/me`);
        console.log(`  GET    /api/bookings`);
        console.log(`  GET    /api/bookings/:id`);
        console.log(`  POST   /api/jobs`);
        console.log(`  PUT    /api/jobs/:id`);
        console.log(`  DELETE /api/jobs/:id`);
        console.log(`  GET    /api/messages/:jobId`);
        console.log(`  POST   /api/messages/:jobId`);
        console.log('');
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new Server();
server.start();

