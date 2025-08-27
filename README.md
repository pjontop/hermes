# 🔐 Hermes - End-to-End Encrypted Chat Application

Hermes is a modern, secure chat application featuring end-to-end encryption, real-time messaging, and a beautiful user interface. Built with Next.js, Express, Socket.IO, and Prisma.

## ✨ Features

- 🔐 **End-to-End Encryption** - Client-side encryption using Web Crypto API (RSA-OAEP + AES-GCM)
- 💬 **Real-time Messaging** - Instant messaging with Socket.IO
- 👥 **Group Chats** - Support for both direct messages and group conversations
- 🔒 **Secure Authentication** - JWT-based authentication with Appwrite integration
- 📱 **Responsive Design** - Beautiful UI with Shadcn/UI components
- 🐳 **Docker Ready** - Complete containerization for easy deployment
- ⚡ **Modern Stack** - Built with Next.js 15, TypeScript, and Tailwind CSS

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15 with TypeScript
- **UI**: Shadcn/UI components with Tailwind CSS
- **Real-time**: Socket.IO client
- **Encryption**: Web Crypto API for E2E encryption
- **State Management**: React hooks and context

### Backend (Express + Socket.IO)
- **Server**: Express.js with TypeScript
- **Real-time**: Socket.IO server
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Caching**: Redis (optional)

### Encryption
- **Key Exchange**: RSA-OAEP 2048-bit keys
- **Message Encryption**: AES-GCM 256-bit
- **Key Storage**: Encrypted local storage with PBKDF2

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- Docker and Docker Compose
- PostgreSQL (for local development)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd hermes
chmod +x setup.sh
./setup.sh
```

### 2. Development Mode
```bash
# Terminal 1: Start database
docker-compose up -d postgres redis

# Terminal 2: Start backend
cd server
npm run dev

# Terminal 3: Start frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

### 3. Production with Docker
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

## 📁 Project Structure

```
hermes/
├── src/                          # Next.js frontend
│   ├── app/                      # App router pages
│   │   ├── auth/                 # Authentication pages
│   │   └── chat/                 # Chat interface
│   ├── components/               # React components
│   │   ├── auth/                 # Auth components
│   │   ├── chat/                 # Chat components
│   │   └── ui/                   # Shadcn/UI components
│   └── lib/                      # Utilities and helpers
│       ├── auth.ts               # Authentication logic
│       ├── encryption.ts         # E2E encryption utilities
│       ├── socket.ts             # Socket.IO client
│       └── chat-api.ts           # API client
├── server/                       # Express backend
│   ├── src/                      # TypeScript source
│   │   ├── routes/               # API routes
│   │   ├── socket/               # Socket.IO handlers
│   │   └── middleware/           # Express middleware
│   └── prisma/                   # Database schema
├── docker-compose.yml            # Docker services
└── setup.sh                     # Development setup script
```

## 🔐 Security Features

### End-to-End Encryption
1. **Key Generation**: Each user generates RSA key pairs client-side
2. **Key Exchange**: Public keys shared via server, private keys never leave client
3. **Message Encryption**: Messages encrypted with AES-GCM before sending
4. **Forward Secrecy**: AES keys rotated per conversation

### Authentication
- JWT tokens for session management
- Secure password hashing with bcrypt
- Integration with Appwrite for user management
- Optional biometric authentication (SMASH patterns)

### Data Protection
- All messages stored encrypted in database
- No plain text message content on server
- Client-side key derivation and storage
- HTTPS/WSS in production

## 🛠️ Configuration

### Environment Variables

**Frontend (`.env.local`)**
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:4000
```

**Backend (`server/.env`)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/hermes_chat
JWT_SECRET=your_super_secure_secret
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
PORT=4000
```

## 📦 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Chat Endpoints
- `GET /api/chat/chats` - Get user's chats
- `POST /api/chat/chats` - Create new chat
- `GET /api/chat/chats/:id/messages` - Get chat messages
- `GET /api/chat/chats/:id/keys` - Get encryption keys
- `POST /api/chat/chats/:id/keys` - Store encryption key

### Socket.IO Events
- `join_chat` - Join a chat room
- `send_message` - Send encrypted message
- `typing_start/stop` - Typing indicators
- `new_message` - Receive new message
- `user_typing` - User typing notification

## 🚀 Deployment

### Production Environment
1. Update environment variables with production values
2. Set strong JWT secrets and database passwords
3. Enable HTTPS/SSL certificates
4. Configure proper CORS settings
5. Set up monitoring and logging

### Docker Deployment
```bash
# Production build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale chat-server=3
```

### Health Checks
- Backend: `GET /health`
- Database: Automatic health checks in Docker
- Frontend: Next.js health endpoint

## 🔧 Development

### Adding New Features
1. Create feature branch
2. Add database migrations if needed
3. Implement backend API endpoints
4. Create frontend components
5. Add real-time Socket.IO events
6. Update encryption if needed

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔒 Security Considerations

- Never store private keys on the server
- Regularly rotate encryption keys
- Use HTTPS in production
- Implement rate limiting
- Monitor for suspicious activity
- Keep dependencies updated

## 📞 Support

For support, email support@hermes-chat.com or create an issue on GitHub.

---

Built with ❤️ by the Hermes team
