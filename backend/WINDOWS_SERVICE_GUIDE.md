# CRM Backend Windows Service Setup

This guide will help you set up the CRM backend as a Windows service that starts automatically with the system.

## Prerequisites

- **Administrator privileges** are required to install Windows services
- Node.js must be installed on the system
- MongoDB should be running (as a service or standalone)

## Quick Setup

### 1. Install the Service

Open PowerShell or Command Prompt **as Administrator** and run:

```bash
cd "c:\Users\lrosas\Documents\18. CRM\DEV\backend"
npm run service:install
```

This will:
- Install the CRM Backend as a Windows service
- Start the service automatically
- Configure it to start with Windows

### 2. Verify Installation

Check if the service is running:

```bash
npm run service:status
```

Or check in Windows Services:
- Press `Win + R`, type `services.msc`, press Enter
- Look for "CRM Backend Service"

## Service Management

### Start/Stop/Restart Service

```bash
# Start the service
npm run service:start

# Stop the service
npm run service:stop

# Restart the service
npm run service:restart

# Check service status
npm run service:status
```

### Uninstall Service

To remove the service completely:

```bash
npm run service:uninstall
```

## Configuration

### Environment Variables

The service uses production environment variables. Create a `.env.service` file in the backend directory:

```bash
cp .env.service.example .env.service
```

Edit `.env.service` with your production settings:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://localhost:27017/crm_production
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
FRONTEND_URL=http://localhost:3000
```

### Service Configuration

The service is configured with:
- **Name**: CRM Backend Service
- **Description**: CRM Application Backend Server
- **Start Type**: Automatic
- **Log On As**: LocalSystem (can be changed for custom user)
- **Working Directory**: Backend project folder
- **Node Options**: `--max_old_space_size=4096`

## Logging

### Service Logs

Service logs are available in multiple locations:

1. **Windows Event Viewer**:
   - Open Event Viewer (`eventvwr.msc`)
   - Navigate to: Windows Logs > Application
   - Filter by source: "CRM Backend Service"

2. **Service Daemon Logs**:
   ```
   C:\ProgramData\CRM Backend Service\daemon\
   ```

3. **Application Logs** (if configured in your app):
   - Check your application's log configuration
   - Default console output goes to Windows Event Log

### Log Rotation

The service automatically handles log rotation through Windows Event Log system.

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're running as Administrator
   - Check if ports are available (default: 5000)

2. **Service Won't Start**
   - Check MongoDB is running
   - Verify environment variables in `.env.service`
   - Check Windows Event Viewer for error details

3. **Database Connection Issues**
   - Ensure MongoDB service is running
   - Check MONGO_URI in configuration
   - Verify network connectivity

### Debug Mode

To run the service in debug mode:

1. Stop the service: `npm run service:stop`
2. Run manually: `npm start`
3. Check console output for errors
4. Fix issues and restart service: `npm run service:start`

### Service Not Starting Automatically

If the service doesn't start with Windows:

1. Open `services.msc`
2. Find "CRM Backend Service"
3. Right-click > Properties
4. Set "Startup type" to "Automatic"
5. Click "OK"

## Security Considerations

### Service Account

By default, the service runs as LocalSystem. For better security:

1. Create a dedicated service user account
2. Grant necessary permissions to the service user
3. Update service configuration to use the service account

### Firewall

Ensure Windows Firewall allows the service port (default: 5000):

1. Open Windows Firewall settings
2. Add inbound rule for port 5000
3. Allow the connection

### File Permissions

Ensure the service has read/write access to:
- Application directory
- Log directories
- Temporary directories

## Monitoring

### Health Checks

The service exposes a health endpoint:
```
GET http://localhost:5000/health
```

### Performance Monitoring

Monitor the service using:
- Windows Performance Monitor
- Task Manager > Services tab
- Resource Monitor

### Automated Monitoring

Consider setting up:
- Windows Service monitoring alerts
- HTTP endpoint monitoring
- Database connection monitoring

## Backup and Recovery

### Before Service Installation

1. Backup your `.env` file
2. Backup your database
3. Note current configuration

### Service Recovery

If the service fails:
1. Check Windows Event Viewer
2. Verify database connectivity
3. Check file permissions
4. Restart the service

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database backup completed
- [ ] MongoDB service installed and running
- [ ] Firewall rules configured
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Service account permissions verified

### Post-Deployment Verification

- [ ] Service starts successfully
- [ ] Health endpoint responds
- [ ] Database connectivity confirmed
- [ ] Frontend can connect to backend
- [ ] Logs are being written correctly

## Updates and Maintenance

### Updating the Service

1. Stop the service: `npm run service:stop`
2. Update your code
3. Install dependencies: `npm install`
4. Start the service: `npm run service:start`

### Regular Maintenance

- Monitor service health
- Review logs regularly
- Update dependencies
- Backup database regularly
- Monitor system resources

---

**Need Help?** 

- Check Windows Event Viewer for detailed error messages
- Review the application logs
- Ensure all prerequisites are met
- Verify network and database connectivity