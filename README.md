# ServiceM8 Customer Portal API

Backend API for the ServiceM8 Customer Portal POC. Built with Express.js, TypeScript, and MongoDB Atlas.

## Features

- ✅ Real ServiceM8 API integration
- ✅ JWT-based authentication
- ✅ MongoDB Atlas database
- ✅ Booking management
- ✅ File attachments
- ✅ Messaging system
- ✅ Data caching

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
api/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # MongoDB connection
│   │   └── env.ts        # Environment variables
│   ├── controllers/      # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── booking.controller.ts
│   │   └── message.controller.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.ts
│   │   └── errorHandler.middleware.ts
│   ├── models/          # Mongoose models
│   │   ├── Customer.model.ts
│   │   ├── Job.model.ts
│   │   ├── Message.model.ts
│   │   ├── Attachment.model.ts
│   │   └── Session.model.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── booking.routes.ts
│   │   ├── message.routes.ts
│   │   └── index.ts
│   ├── services/        # Business logic
│   │   └── servicem8.service.ts
│   ├── utils/           # Utility functions
│   │   └── jwt.utils.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── scripts/         # Utility scripts
│   │   └── seed.ts
│   └── server.ts        # Main server file
├── package.json
├── tsconfig.json
└── .env.example
```

## How It Works

### 1. Authentication
- Customers login with email and phone
- System validates credentials against MongoDB
- JWT token is generated and returned
- Token is required for all protected endpoints

### 2. ServiceM8 Integration
- Real API calls to ServiceM8 for job data
- HTTP Basic Authentication with ServiceM8 credentials
- Jobs are cached in MongoDB for 5 minutes
- Customer matching by email/phone in job contact details

### 3. Data Caching
- ServiceM8 responses are cached in MongoDB
- Reduces API calls and improves performance
- Cache refreshes every 5 minutes or on demand

### 4. Messaging
- Messages are stored in MongoDB
- Not integrated with ServiceM8 (would require webhooks)
- Simple chat interface for customer-business communication

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

