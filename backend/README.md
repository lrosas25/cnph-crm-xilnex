# CRM Backend API

A robust Node.js backend API for Customer Relationship Management (CRM) system built with Express.js and MongoDB.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **User Management** - Admin, Manager, and User roles with different permissions
- 📞 **Contact Management** - CRUD operations for customer contacts
- � **Xilnex Integration** - Automatic sync of customers to Xilnex API
- �🔍 **Search & Filtering** - Advanced search and filtering capabilities
- 📊 **Data Validation** - Comprehensive input validation and sanitization
- 🛡️ **Security** - Helmet, CORS, rate limiting, and other security measures
- 📝 **Logging** - Morgan logging for request tracking
- 🗃️ **Database** - MongoDB with Mongoose ODM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs
- **Environment**: dotenv

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crm_database
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password

### Users (Admin/Manager only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Contacts
- `GET /api/contacts` - Get contacts (filtered by user role)
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/contacts/search?q=term` - Search contacts
- `GET /api/contacts/status/:status` - Get contacts by status
- `POST /api/contacts/:id/sync-xilnex` - Manually sync contact with Xilnex
- `POST /api/contacts/batch-sync-xilnex` - Batch sync all customers with Xilnex (Admin/Manager only)

### Health Check
- `GET /health` - API health check

## User Roles

- **Admin**: Full access to all resources
- **Manager**: Access to all contacts and users (read-only for users)
- **User**: Access only to assigned contacts

## Contact Status

- `lead` - Initial contact/lead
- `prospect` - Qualified prospect
- `customer` - Converted customer
- `inactive` - Inactive contact

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | - |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRE | JWT expiration time | 30d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |
| XILNEX_API_URL | Xilnex API base URL | https://api.xilnex.com |
| XILNEX_APPID | Xilnex application ID | - |
| XILNEX_APPTOKEN | Xilnex application token | - |
| XILNEX_AUTH | Xilnex auth parameter | - |
| XILNEX_ENABLED | Enable/disable Xilnex integration | true |

## Security Features

- Helmet for security headers
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- JWT authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Error handling middleware

## Database Schema

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: ['user', 'admin', 'manager'],
  department: ['sales', 'marketing', 'support', 'management'],
  phone: String,
  isActive: Boolean,
  lastLogin: Date,
  timestamps: true
}
```

### Contact Schema
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required),
  phone: String,
  company: String,
  position: String,
  status: ['lead', 'prospect', 'customer', 'inactive'],
  source: ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other'],
  address: Object,
  notes: String,
  tags: [String],
  assignedTo: ObjectId (ref: User),
  lastContactDate: Date,
  nextFollowUpDate: Date,
  dealValue: Number,
  isActive: Boolean,
  // Xilnex Integration Fields
  xilnexClientId: String,
  xilnexSyncStatus: ['pending', 'synced', 'failed', 'not_synced'],
  xilnexSyncDate: Date,
  xilnexSyncError: String,
  timestamps: true
}
```

## Xilnex Integration

The CRM automatically syncs customer contacts with Xilnex when:
- A contact's status is changed to "customer"
- An existing customer contact is updated

### Xilnex Configuration

1. Set up your Xilnex API credentials in `.env`:
```env
XILNEX_API_URL=https://api.xilnex.com
XILNEX_APPID=your_app_id_here
XILNEX_APPTOKEN=your_app_token_here
XILNEX_AUTH=your_auth_value_here
XILNEX_ENABLED=true
```

2. The system will automatically:
   - Create new clients in Xilnex when contacts become customers
   - Update existing clients when customer data changes
   - Track sync status and errors in the database

### Manual Sync Options

- **Individual Sync**: `POST /api/contacts/:id/sync-xilnex`
- **Batch Sync**: `POST /api/contacts/batch-sync-xilnex` (Admin/Manager only)

### Sync Status Values

- `not_synced` - Contact not yet synced with Xilnex
- `pending` - Sync in progress
- `synced` - Successfully synced with Xilnex
- `failed` - Sync failed (check `xilnexSyncError` for details)

## Windows Service Deployment

For production deployment on Windows, you can install the backend as a Windows service that starts automatically with the system.

### Quick Service Setup

1. **Install as Windows Service** (requires Administrator privileges):
```bash
npm run service:install
```

2. **Manage the Service**:
```bash
npm run service:start    # Start the service
npm run service:stop     # Stop the service
npm run service:restart  # Restart the service
npm run service:status   # Check service status
```

3. **Uninstall Service**:
```bash
npm run service:uninstall
```

### Service Management Tools

- **GUI Tool**: Run `service-manager.bat` as Administrator for a menu-driven interface
- **Windows Services**: Use `services.msc` to manage through Windows Services Manager
- **Event Logs**: View service logs in Windows Event Viewer

### Service Configuration

The service runs with the following settings:
- **Name**: CRM Backend Service
- **Port**: 5000 (configurable via environment)
- **Environment**: Production mode
- **Auto-start**: Yes (starts with Windows)
- **Logs**: Windows Event Viewer + Application logs

For detailed service setup and troubleshooting, see [WINDOWS_SERVICE_GUIDE.md](./WINDOWS_SERVICE_GUIDE.md).

## Error Handling

The API includes comprehensive error handling:
- Validation errors
- Authentication errors
- Authorization errors
- Database errors
- 404 errors
- 500 server errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.