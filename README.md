# binIQ Admin Panel - Full Stack Application

A comprehensive admin panel for the binIQ platform with integrated frontend and backend.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Authentication**: JWT with role-based access control
- **UI Components**: Radix UI + shadcn/ui

## 📁 Project Structure

```
biniq-admin/
├── src/                    # Frontend React application
│   ├── components/         # UI components
│   ├── pages/             # Application pages
│   ├── lib/               # Utilities and auth
│   └── context/           # React contexts
├── backend/               # Backend API server
│   ├── routes/           # API routes
│   ├── models/           # MongoDB models
│   ├── middleware/       # Auth middleware
│   └── server.js         # Express server
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- MongoDB Atlas account (or local MongoDB)
- Git

### Setup

1. **Clone and Install**

   ```bash
   git clone <your-repo-url>
   cd biniq-admin
   npm run setup  # Installs both frontend and backend dependencies
   ```

2. **Configure Environment**

   Create `backend/.env`:

   ```env
   MONGODB_URI=mongodb+srv://janirudraksh228:YE8BjPlHJwMmI52h@cluster0.lw1uesm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   EMAIL_USER=rudrakshjani948@gmail.com
   EMAIL_PASS=mrlt vfln iimh kbtx
   JWT_SECRET=mySuperSecretKey123!@#$%^&*()_forBinIQ2025
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

3. **Run the Application**

   ```bash
   # Run both frontend and backend concurrently
   npm run dev:full

   # Or run separately:
   npm run dev:backend  # Backend on port 3001
   npm run dev          # Frontend on port 5173
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: https://biniq-backend.onrender.com/api

## 🔐 Authentication

### Admin Login

- **Email**: Create an admin user with role `1` in MongoDB
- **Password**: Set during user creation
- **JWT Token**: Stored in localStorage as `biniq_admin_token`

### User Roles

- `1`: Admin (full access)
- `2`: Reseller
- `3`: Store Owner

## 📊 Features

### Dashboard

- Real-time statistics (users, revenue, subscriptions)
- Recent activity feed
- Quick metrics overview

### User Management

- **Store Owners**: Approve/reject, view detailed profiles
- **Resellers**: Manage accounts and subscription tracking
- Account deletion and status management

### Subscription Management

- Payment tracking and statistics
- Subscription details and history
- Revenue analytics

### Content Management

- **FAQ System**: CRUD operations with target audience
- **Notifications**: Broadcast to specific user groups
- **Feedback**: Customer support and reply system

### System Administration

- API key management
- System settings configuration
- Admin profile management

## 🔧 API Endpoints

### Authentication

```
POST /api/users/login - Admin login
```

### Users

```
GET  /api/users/all-details-store-owner - Get all store owners
GET  /api/users/all-details-resellar - Get all resellers
POST /api/users/approve-store-owner - Approve store owner
POST /api/users/reject-store-owner - Reject store owner
DELETE /api/users/delete-account - Delete user account
```

### Feedback

```
GET  /api/users/feedback - Get all feedback
POST /api/users/feedback/reply - Reply to feedback
```

### Subscriptions

```
GET /api/subscriptions/all - Get all subscriptions
GET /api/subscriptions/stats - Get subscription statistics
```

### FAQ

```
GET    /api/faqs - Get all FAQs
POST   /api/faqs - Create FAQ
PUT    /api/faqs/:id - Update FAQ
DELETE /api/faqs/:id - Delete FAQ
```

### Notifications

```
GET    /api/notifications - Get all notifications
POST   /api/notifications - Create notification
PUT    /api/notifications/:id - Update notification
DELETE /api/notifications/:id - Delete notification
```

### Statistics

```
GET /api/stats/paid-users - Paid users statistics
GET /api/stats/store-owners - Store owners statistics
GET /api/stats/resellers - Resellers statistics
GET /api/stats/revenue - Revenue statistics
GET /api/stats/quick-stats - Dashboard quick stats
GET /api/stats/recent-activity - Recent user activity
```

## 🗄️ Database Models

### User Model

- Personal information and authentication
- Role-based access control
- Subscription tracking

### Store Model

- Store details and location
- Social media links
- Ratings and reviews

### Subscription Model

- Payment information
- Feature usage tracking
- Subscription lifecycle

### Feedback Model

- Customer feedback and ratings
- Admin replies and resolution tracking

### FAQ Model

- Question/answer pairs
- Target audience specification
- Version history and analytics

### Notification Model

- Targeted messaging system
- Delivery statistics
- Scheduling capabilities

## 🔒 Security Features

- JWT authentication with token expiration
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Helmet security headers
- Password hashing with bcrypt

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy dist/ folder
```

### Backend (Vercel/Railway/Heroku)

```bash
cd backend
# Deploy with your preferred platform
```

### Environment Variables for Production

```env
VITE_API_URL=https://your-backend-domain.com/api
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
```

## 🛠️ Development

### Adding New Features

1. Create/update MongoDB models in `backend/models/`
2. Add API routes in `backend/routes/`
3. Create frontend components in `src/components/`
4. Add pages in `src/pages/`
5. Update routing in `src/App.tsx`

### Code Standards

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Consistent API response formats
- Error handling and loading states

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

- Check the GitHub issues
- Contact: rudrakshjani948@gmail.com

---

**binIQ Admin Panel** - Empowering business management through technology.
