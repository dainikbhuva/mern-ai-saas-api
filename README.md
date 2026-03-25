# MERN AI SaaS API

A Node.js/Express backend API for an AI-powered digital marketing SaaS platform. Features JWT authentication, Google Ads copy generation using Gemini and OpenAI APIs, and multi-tenant user management with quota systems.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Google Gemini API key
- OpenAI API key (optional, for secondary AI provider)

### Local Development Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd mern-ai-saas-api
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start Development Server**
   ```bash
   npm run dev  # Uses tsx watch for hot reload
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

The API will be available at `http://localhost:5000`

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_20_characters

# Server
PORT=5000
FRONTEND_URL=http://localhost:5173

# AI APIs
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

## 🏗️ Architecture

### Core Components

**Authentication Layer**
- JWT-based authentication with bcrypt password hashing
- Protected routes middleware for API security
- User registration/login with email validation

**AI Integration Layer**
- Dual AI provider support (Google Gemini + OpenAI)
- Structured prompt engineering for Google Ads copy generation
- Error handling and fallback mechanisms

**Business Logic Layer**
- User quota management (5 free generations/month)
- Generation history tracking with MongoDB
- Multi-tenant data isolation

**Data Layer**
- MongoDB with Mongoose ODM
- User model with authentication and quota fields
- Generation model for AI output history

### API Endpoints

```
POST /api/auth/register  - User registration
POST /api/auth/login     - User authentication
GET  /api/ai/quota       - Get user quota info
POST /api/ai/generate/ads - Generate Google Ads copy
GET  /api/ai/history     - Get generation history
```

### Database Schema

**User Collection:**
```javascript
{
  email: String (unique),
  passwordHash: String,
  plan: String (default: 'free'),
  monthlyQuota: Number (default: 5),
  usedThisMonth: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

**Generation Collection:**
```javascript
{
  userId: ObjectId (ref: User),
  type: String ('ads', 'seo', 'social_media', 'design_brief'),
  input: Object (user inputs),
  output: String (AI response),
  provider: String ('gemini', 'openai'),
  tokensUsed: Number,
  createdAt: Date
}
```

## 🧪 Testing

### Manual Testing with cURL

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Generate ads (use token from login response)
curl -X POST http://localhost:5000/api/ai/generate/ads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productDescription": "React development platform",
    "targetAudience": "junior developers",
    "provider": "gemini"
  }'
```

### Unit Tests (Future Implementation)
```bash
npm test  # Currently placeholder, implement with Jest + Supertest
```

## 🚀 Production Deployment

### Render.com Deployment

1. **Connect Repository**
   - Create new Web Service on Render
   - Connect your GitHub repository
   - Set branch to `main`

2. **Build Settings**
   - Build Command: `npm run build`
   - Start Command: `npm start`

3. **Environment Variables**
   - Add all variables from `.env` in Render dashboard
   - Use production MongoDB Atlas URI
   - Set `FRONTEND_URL` to your Vercel/Netlify domain

4. **Database**
   - Use MongoDB Atlas for production
   - Enable network access for Render IP ranges
   - Create database user with read/write permissions

### Railway.app Alternative

1. **Deploy from GitHub**
   - Connect repository
   - Railway auto-detects Node.js

2. **Environment Variables**
   - Set in Railway dashboard

3. **Database**
   - Use Railway's built-in MongoDB or connect Atlas

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: 7-day expiration with secure secrets
- **CORS**: Configured for frontend domain
- **Input Validation**: Email format and password strength
- **Rate Limiting**: Express rate limiter (configurable)
- **Data Isolation**: User-scoped queries prevent data leakage

## 📊 Monitoring & Logging

- Console logging for API requests and errors
- MongoDB connection status monitoring
- AI API error tracking and fallback
- User quota usage tracking

## 🐛 Known Limitations

1. **Quota Reset**: Monthly quota resets manually (no cron job)
2. **Error Handling**: Basic error responses (could be more detailed)
3. **Rate Limiting**: Not implemented (express-rate-limit available)
4. **Testing**: No automated tests yet
5. **Caching**: No response caching for repeated requests
6. **File Uploads**: No support for image/document uploads

## 🚀 Future Improvements

1. **Advanced Features**
   - Multiple AI modules (SEO, Social Media, Design Brief)
   - Streaming responses for real-time AI output
   - File upload support for design briefs
   - Export functionality (PDF, DOCX)

2. **Performance**
   - Redis caching for frequent requests
   - Database query optimization and indexing
   - API response compression
   - Load balancing support

3. **Security**
   - OAuth integration (Google, GitHub)
   - Two-factor authentication
   - API key rotation
   - Audit logging

4. **Business Features**
   - Subscription tiers (Free/Pro/Enterprise)
   - Stripe payment integration
   - Usage analytics dashboard
   - Team collaboration features

5. **Developer Experience**
   - Comprehensive test suite (Jest + Supertest)
   - API documentation (Swagger/OpenAPI)
   - Docker containerization
   - CI/CD pipeline

## 📝 API Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "data": { ... } | null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  } | null
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.