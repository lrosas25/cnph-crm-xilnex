const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'CRM Backend Service',
  script: path.join(__dirname, 'src', 'server.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('✅ CRM Backend Service uninstalled successfully!');
  console.log('🗑️  Service has been removed from Windows Services');
  process.exit(0);
});

svc.on('error', function(err) {
  console.error('❌ Service uninstallation failed:', err);
  process.exit(1);
});

console.log('🗑️  Uninstalling CRM Backend Service...');
console.log('⚠️  Note: This requires administrator privileges');
console.log('');

// Uninstall the service
svc.uninstall();