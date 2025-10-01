# CRM Application - CNPH

A full-stack Customer Relationship Management (CRM) application with Xilnex integration.

## 🏗️ Project Structure

```
DEV/
├── frontend/          # React.js frontend application
└── backend/           # Node.js/Express backend API
```

## 🚀 Features

### Frontend (React.js)
- 📱 Responsive Material-UI design
- 🔐 JWT-based authentication
- 👥 Multi-step customer registration
- 📊 Dashboard with analytics
- 🏪 Outlet management
- 🔍 Advanced search and filtering

### Backend (Node.js/Express)
- 🛡️ Secure API with JWT authentication
- 🗄️ MongoDB integration
- 🔗 Xilnex API synchronization
- 📝 Comprehensive logging
- 🚀 Windows Service support
- ⚡ Production-ready configuration

## 🔧 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB
- Git

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/lrosas25/cnph-crm-xilnex.git
cd cnph-crm-xilnex
```

2. **Setup Backend**:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Setup Frontend**:
```bash
cd ../frontend
npm install
npm start
```

## 📖 Documentation

- **Backend API**: See `backend/README.md`
- **Windows Service**: See `backend/WINDOWS_SERVICE_GUIDE.md`
- **Testing Guide**: See `backend/TESTING_GUIDE.md`

## 🌐 Live URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔐 Default Access

Configure your admin user through the authentication system.

## 📁 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/crm_dev
JWT_SECRET=your-secret-key
XILNEX_ENABLED=true
XILNEX_API_URL=https://api.xilnex.com
# ... other Xilnex config
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 🚀 Production Deployment

### Windows Service (Backend)
```bash
cd backend
npm run service:install  # Run as Administrator
```

### Frontend Build
```bash
cd frontend
npm run build
# Deploy build/ folder to web server
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### API Testing
```bash
cd backend
npm run test:api
```

## 📱 Tech Stack

### Frontend
- React.js
- Material-UI
- Axios
- React Router

### Backend
- Node.js
- Express.js
- MongoDB/Mongoose
- JWT Authentication
- Xilnex API Integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the documentation in each component
- Review the troubleshooting guides
- Create an issue on GitHub