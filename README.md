# ServiceM8 Customer Portal API

Backend API for the ServiceM8 Customer Portal POC. Built with Express.js, TypeScript, and MongoDB Atlas.

## Features

- ✅ Real ServiceM8 API integration
- ✅ JWT-based authentication
- ✅ MongoDB Atlas database
- ✅ Booking management
- ✅ File attachments
- ✅ Messaging system
- ✅ Data caching (5-minute time-based)
- ✅ Enterprise-grade security (Helmet, rate limiting, input sanitization)
- ✅ Structured logging (Winston)
- ✅ Request validation (Zod schemas)
- ✅ Layered architecture (Controllers → Services → Repositories)

## Prerequisites

1. **Node.js** v18 or higher
2. **MongoDB Atlas** account with connection string
3. **ServiceM8** account with API credentials

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=4000
NODE_ENV=development

JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

SERVICEM8_EMAIL=your-servicem8-email@example.com
SERVICEM8_API_TOKEN=your-servicem8-api-token

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/servicem8-portal?retryWrites=true&w=majority

FRONTEND_URL=http://localhost:3000
```

### 3. Get ServiceM8 API Credentials

1. Log in to ServiceM8
2. Go to Settings → API Keys
3. Generate a new API key
4. Copy your email and API token to `.env`

### 4. Set Up MongoDB Atlas

1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create a new cluster (free M0 tier works fine)
3. Create a database user
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get your connection string and add it to `.env`

### 5. Seed the Database

```bash
npm run seed
```

This creates test customers you can use to login:
- Email: `john@example.com` / Phone: `+1234567890`
- Email: `jane@example.com` / Phone: `+0987654321`
- Email: `bob@example.com` / Phone: `+1122334455`

### 6. Start the Server

```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/login
Body: { email: string, phone: string }
Response: { token: string, customer: object }

POST /api/auth/logout
Headers: Authorization: Bearer <token>

GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { customer: object }
```

### Bookings
```
GET /api/bookings
Headers: Authorization: Bearer <token>
Response: { bookings: array }

GET /api/bookings/:id
Headers: Authorization: Bearer <token>
Response: { booking: object, attachments: array }
```

### Messages
```
GET /api/messages/:jobId
Headers: Authorization: Bearer <token>
Response: { messages: array }

POST /api/messages/:jobId
Headers: Authorization: Bearer <token>
Body: { message: string }
Response: { message: object }
```

## Project Structure

```
src/
├── config/               # Configuration
│   ├── database.ts       # MongoDB connection
│   ├── env.ts            # Environment variables
│   └── logger.ts         # Winston logger config
│
├── controllers/          # HTTP layer (thin controllers)
│   ├── auth.controller.ts
│   ├── booking.controller.ts
│   ├── job.controller.ts
│   └── message.controller.ts
│
├── services/             # Business logic layer
│   ├── auth.service.ts       # Authentication logic
│   ├── booking.service.ts    # Booking/caching logic
│   ├── job.service.ts        # Job CRUD with ServiceM8
│   ├── message.service.ts    # Messaging logic
│   └── servicem8.service.ts  # ServiceM8 API client
│
├── repositories/         # Data access layer
│   ├── base.repository.ts
│   ├── customer.repository.ts
│   ├── job.repository.ts
│   ├── message.repository.ts
│   ├── attachment.repository.ts
│   └── session.repository.ts
│
├── middleware/           # Express middleware
│   ├── auth.middleware.ts
│   ├── errorHandler.middleware.ts
│   ├── validation.middleware.ts
│   ├── rateLimiter.middleware.ts
│   ├── requestLogger.middleware.ts
│   └── security.middleware.ts
│
├── validators/           # Zod validation schemas
│   ├── auth.validator.ts
│   ├── booking.validator.ts
│   ├── job.validator.ts
│   └── message.validator.ts
│
├── models/               # Mongoose models
│   ├── Customer.model.ts
│   ├── Job.model.ts
│   ├── Message.model.ts
│   ├── Attachment.model.ts
│   └── Session.model.ts
│
├── routes/               # API routes
│   ├── auth.routes.ts
│   ├── booking.routes.ts
│   ├── job.routes.ts
│   ├── message.routes.ts
│   └── index.ts
│
├── utils/                # Utility functions
│   ├── jwt.utils.ts
│   ├── logger.ts
│   ├── errors.ts         # Custom error classes
│   ├── asyncHandler.ts   # Async error wrapper
│   └── response.ts       # Response formatters
│
├── types/                # TypeScript types
│   └── index.ts
│
├── scripts/              # Utility scripts
│   └── seed.ts
│
└── server.ts             # Main server file
```

## Architecture

The application follows a layered architecture for separation of concerns:

```
Routes (+ Zod validation)
    ↓
Controllers (HTTP handling only)
    ↓
Services (business logic)
    ↓
Repositories (data access)
    ↓
Models (Mongoose schemas)
```

### Key Design Patterns

- **Repository Pattern**: Abstracts database operations
- **Service Layer**: Encapsulates business logic
- **Async Handler**: Eliminates try-catch boilerplate
- **Custom Error Classes**: Consistent error handling
- **Response Formatters**: Standardized API responses

## How It Works

### 1. Authentication
- Customers register/login with email or phone + password
- Password hashed with bcrypt
- JWT token generated and returned
- Session stored in database for tracking
- Token required for all protected endpoints

### 2. Security
- **Helmet**: Security headers (CSP, HSTS, XSS protection)
- **Rate Limiting**: 
  - General API: 100 requests/15min
  - Auth endpoints: 5 attempts/15min
  - Job creation: 20 requests/15min
- **Input Sanitization**: NoSQL injection prevention
- **Zod Validation**: Type-safe request validation

### 3. ServiceM8 Integration
- Real API calls to ServiceM8 for job data
- API Key authentication with ServiceM8
- Jobs cached in MongoDB for 5 minutes
- Customer matching by email/phone in job contact details
- Two-phase writes (ServiceM8 first, then MongoDB)

### 4. Data Caching
- ServiceM8 responses cached in MongoDB
- 5-minute cache duration
- Reduces API calls and improves performance
- Automatic refresh on cache miss

### 5. Error Handling
- Custom error classes (ValidationError, NotFoundError, etc.)
- Centralized error handler middleware
- Structured logging with Winston
- Different error responses for dev vs production

### 6. Messaging
- Messages stored in MongoDB
- Job ownership validation before sending
- Customer and system message types

## Development

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Testing

You can test the API using tools like:
- **Thunder Client** (VS Code extension)
- **Postman**
- **curl**

### Example: Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "phone": "+1234567890"}'
```

### Example: Get Bookings
```bash
curl -X GET http://localhost:4000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### MongoDB Connection Failed
- Check your `MONGODB_URI` in `.env`
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify database user credentials

### ServiceM8 API Returns 401
- Check your `SERVICEM8_EMAIL` and `SERVICEM8_API_TOKEN`
- Ensure the API key is active in ServiceM8

### No Jobs Returned
- Ensure you have jobs in your ServiceM8 account
- Check that job contact email/phone matches your test customers
- Look at server logs for matching details

## License

MIT

