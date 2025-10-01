# 🧪 CRM System Testing Guide

## Prerequisites

Before testing, ensure you have:
- ✅ Node.js installed
- ✅ MongoDB running (local or cloud)
- ✅ Your Xilnex API credentials configured in `.env`

## 🚀 Step-by-Step Testing Process

### Step 1: Start MongoDB (if using local)
```bash
# Windows (if MongoDB is installed as service, it should auto-start)
# Or manually start MongoDB
mongod
```

### Step 2: Install Dependencies & Start Backend
```bash
# Navigate to backend directory
cd "C:\Users\lrosas\Documents\18. CRM\DEV\backend"

# Install dependencies (if not done already)
npm install

# Start the development server
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 5685 in development mode
📦 MongoDB Connected: 127.0.0.1
```

### Step 3: Seed Sample Data (Optional)
```bash
# In a new terminal, run the seed script
node seed.js
```

**Expected Output:**
```
🗑️  Existing data cleared
👥 Users created
📞 Sample contacts created
✅ Database seeded successfully!

📋 Sample credentials:
Admin: admin@crm.com / admin123
Manager: manager@crm.com / manager123
User 1: john@crm.com / user123
User 2: jane@crm.com / user123
```

### Step 4: Test API Endpoints

#### 4.1 Test Health Check
```bash
curl http://localhost:5685/health
```

#### 4.2 Test Authentication
```bash
curl -X POST http://localhost:5685/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"your-email@domain.com\",\"password\":\"your-password\"}"
```

#### 4.3 Test Contact Creation with Xilnex Sync
```bash
# Replace YOUR_TOKEN with the token from login response
curl -X POST http://localhost:5685/api/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"Customer\",
    \"email\": \"test@example.com\",
    \"phone\": \"+1-555-0199\",
    \"company\": \"Test Corp\",
    \"status\": \"customer\"
  }"
```

### Step 5: Test HTML Form Interface

#### 5.1 Option A: Direct Browser Access
1. Open `customer-entry.html` in your browser
2. Update the API URL if needed (should be `http://localhost:5685/api`)

#### 5.2 Option B: Using Simple Server
```bash
# Start the form server
node serve-form.js
```
Then visit: `http://localhost:3001`

### Step 6: Test Form Functionality

1. **Login Test:**
   - Email: `your-email@domain.com`
   - Password: `your-password`
   - Click "🔑 Login"
   - ✅ Should see: "✅ Logged in successfully"

2. **Sample Data Test:**
   - Click "🎲 Sample Data" to fill form
   - ✅ Form should populate with test data

3. **Create Customer Test:**
   - Fill out the form (or use sample data)
   - Set Status to "Customer" (for Xilnex sync)
   - Click "💾 Create Customer"
   - ✅ Should see: "✅ Customer created successfully! ID: [contact_id]"
   - ✅ Should see: "🔗 Xilnex sync status: [status]"

## 🔍 Monitoring & Debugging

### Backend Logs
Watch the terminal running `npm run dev` for:

```
🔗 Xilnex API Request: POST /clients
✅ Xilnex API Response: 200 OK
✅ Contact synced with Xilnex successfully
```

Or error messages:
```
❌ Xilnex API Error: 401 Unauthorized
❌ Failed to sync with Xilnex: [error details]
```

### Database Verification
```bash
# Connect to MongoDB
mongo

# Use your database
use crm_database

# Check contacts
db.contacts.find().pretty()

# Check for Xilnex sync fields
db.contacts.find({"xilnexSyncStatus": {$exists: true}}).pretty()
```

## 🧪 Manual API Testing with Postman/Insomnia

### Collection Setup:
1. **Base URL**: `http://localhost:5685`
2. **Authentication**: Bearer Token (get from login)

### Test Requests:

#### 1. Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "your-email@domain.com",
  "password": "your-password"
}
```

#### 2. Create Customer (triggers Xilnex sync)
```
POST /api/contacts
Authorization: Bearer [your_token]
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@testcorp.com",
  "phone": "+1-555-0123",
  "company": "Test Corporation",
  "position": "CEO",
  "status": "customer",
  "source": "website",
  "dealValue": 50000,
  "address": {
    "street": "123 Business St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105",
    "country": "United States"
  },
  "notes": "High-value prospect",
  "tags": ["vip", "enterprise"]
}
```

#### 3. Manual Xilnex Sync
```
POST /api/contacts/[contact_id]/sync-xilnex
Authorization: Bearer [your_token]
```

#### 4. Batch Xilnex Sync (Admin/Manager only)
```
POST /api/contacts/batch-sync-xilnex
Authorization: Bearer [your_token]
```

#### 5. Get Contacts
```
GET /api/contacts
Authorization: Bearer [your_token]
```

## 🐛 Common Issues & Solutions

### Issue: "ECONNREFUSED" Error
**Solution:** Make sure MongoDB is running
```bash
# Check if MongoDB is running
netstat -an | findstr :27017
```

### Issue: "Xilnex sync failed"
**Solution:** Check your Xilnex credentials in `.env`:
- `XILNEX_APPID`
- `XILNEX_APPTOKEN`
- `XILNEX_AUTH`
- `XILNEX_ENABLED=true`

### Issue: CORS Error in Browser
**Solution:** Make sure `FRONTEND_URL` in `.env` includes your form's URL

### Issue: Token Expired
**Solution:** Re-login to get a new token

## ✅ Success Indicators

### Backend Started Successfully:
- ✅ Server running on port 5685
- ✅ MongoDB Connected
- ✅ No error messages in console

### Customer Creation Success:
- ✅ HTTP 201 response
- ✅ Contact saved in database
- ✅ Xilnex sync status: "synced" or "pending"

### Xilnex Integration Working:
- ✅ API requests logged in console
- ✅ No authentication errors
- ✅ Contact has `xilnexClientId` field populated

## 📊 Testing Checklist

- [ ] Backend server starts without errors
- [ ] MongoDB connection established
- [ ] Sample data seeded successfully
- [ ] Health check endpoint responds
- [ ] Login authentication works
- [ ] HTML form loads properly
- [ ] Form authentication works
- [ ] Customer creation works
- [ ] Xilnex sync triggered automatically
- [ ] Manual sync endpoint works
- [ ] Batch sync works (admin/manager)
- [ ] Error handling works properly

## 🎯 Next Steps After Testing

1. **Production Setup**: Update environment variables for production
2. **Security**: Configure secure passwords and JWT secrets
3. **Monitoring**: Set up logging and monitoring
4. **Backup**: Configure database backups
5. **Documentation**: Document any custom configurations

---

**Need Help?** Check the console logs for detailed error messages and refer to the API documentation in `README.md`.