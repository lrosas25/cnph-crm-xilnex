const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'CRM Backend Service',
  description: 'CRM Application Backend Server',
  script: path.join(__dirname, 'src', 'server.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    },
    {
      name: "PORT", 
      value: "5000"
    }
  ],
  workingDirectory: __dirname,
  allowServiceLogon: true,
  logOnAs: {
    domain: 'localhost',
    account: process.env.SERVICE_USER || 'LocalSystem',
    password: process.env.SERVICE_PASSWORD || ''
  }
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  console.log('✅ CRM Backend Service installed successfully!');
  console.log('📋 Service Details:');
  console.log(`   Name: ${svc.name}`);
  console.log(`   Description: ${svc.description}`);
  console.log(`   Script: ${svc.script}`);
  console.log('');
  console.log('🚀 Starting the service...');
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.log('ℹ️  Service is already installed.');
  console.log('🔄 To reinstall, first run: npm run service:uninstall');
});

svc.on('start', function() {
  console.log('✅ CRM Backend Service started successfully!');
  console.log('');
  console.log('📊 Service Management Commands:');
  console.log('   Start:     npm run service:start');
  console.log('   Stop:      npm run service:stop');
  console.log('   Restart:   npm run service:restart');
  console.log('   Uninstall: npm run service:uninstall');
  console.log('');
  console.log('📝 View logs in Windows Event Viewer or:');
  console.log('   Application Logs: C:\\ProgramData\\CRM Backend Service\\daemon\\');
  process.exit(0);
});

svc.on('error', function(err) {
  console.error('❌ Service installation failed:', err);
  process.exit(1);
});

console.log('🔧 Installing CRM Backend Service...');
console.log('⚠️  Note: This requires administrator privileges');
console.log('');

// Install the service
svc.install();