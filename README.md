# Hindi OCR System - Next.js Backend

Backend API for the Hindi OCR system built with Next.js, MongoDB, JWT authentication, and AWS S3.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with HTTP-only cookies
- 💬 **Chat History** - Store and retrieve chat conversations like ChatGPT
- 📄 **Document Upload** - Upload documents to AWS S3
- 🗄️ **MongoDB Integration** - NoSQL database for flexible data storage
- 🔒 **Secure API** - Protected routes with JWT middleware
- 📤 **File Storage** - AWS S3 integration for document storage

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- AWS Account with S3 bucket configured

## Installation

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Create environment file:**
   ```powershell
   Copy-Item .env.example .env
   ```

3. **Configure environment variables in `.env`:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/hindi-ocr
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   AWS_ACCESS_KEY_ID=your-aws-access-key-id
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
   AWS_REGION=ap-south-1
   AWS_S3_BUCKET=hindi-ocr-documents
   PYTHON_BACKEND_URL=http://localhost:8000
   NODE_ENV=development
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## Running the Server

**Development mode:**
```powershell
npm run dev
```

The server will start on `http://localhost:3001`

**Production build:**
```powershell
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (protected)

### Chats
- `GET /api/chats` - Get all user chats (protected)
- `POST /api/chats` - Create new chat (protected)
- `GET /api/chats/[id]` - Get specific chat (protected)
- `PUT /api/chats/[id]` - Update chat (protected)
- `DELETE /api/chats/[id]` - Delete chat (protected)
- `POST /api/chats/[id]/message` - Send message to chat (protected)

### Documents
- `GET /api/documents` - Get all user documents (protected)
- `POST /api/documents` - Upload document (protected)
- `GET /api/documents/[id]` - Get specific document (protected)
- `DELETE /api/documents/[id]` - Delete document (protected)

## Database Models

### User
- email (unique)
- password (hashed)
- name
- role (user/admin)

### Chat
- userId
- title
- messages (array)
  - role (user/assistant/system)
  - content
  - timestamp

### Document
- userId
- chatId (optional)
- fileName
- originalName
- fileSize
- mimeType
- s3Key
- s3Url
- status (pending/processing/completed/failed)
- extractedText
- processedData

## AWS S3 Setup

1. Create an S3 bucket in AWS
2. Configure bucket permissions for your IAM user
3. Enable CORS if accessing from frontend
4. Add bucket name to `.env` file

## MongoDB Setup

**Local MongoDB:**
```powershell
# Install MongoDB and start service
mongod
```

**MongoDB Atlas (Cloud):**
1. Create account at mongodb.com
2. Create cluster
3. Get connection string
4. Update MONGODB_URI in `.env`

## Integration with Python Backend

The Next.js backend is designed to communicate with a Python backend for OCR processing:

- Document uploads trigger OCR processing via Python backend
- Chat messages can request RAG responses from Python backend
- Update `PYTHON_BACKEND_URL` when Python backend is ready

## Security Notes

- JWT tokens stored in HTTP-only cookies
- Passwords hashed with bcrypt
- Protected routes require valid JWT
- S3 files encrypted at rest (AES256)
- Environment variables for sensitive data

## Project Structure

```
nextjs-backend/
├── app/
│   └── api/
│       ├── auth/          # Authentication endpoints
│       ├── chats/         # Chat management endpoints
│       └── documents/     # Document upload endpoints
├── lib/
│   ├── mongodb.ts         # Database connection
│   ├── jwt.ts             # JWT utilities
│   ├── auth.ts            # Auth utilities
│   └── s3.ts              # AWS S3 utilities
├── middleware/
│   └── auth.ts            # JWT middleware
├── models/
│   ├── User.ts            # User model
│   ├── Chat.ts            # Chat model
│   └── Document.ts        # Document model
└── package.json
```

## License

MIT
