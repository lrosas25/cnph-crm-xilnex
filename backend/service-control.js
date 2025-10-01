const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'CRM Backend Service',
  script: path.join(__dirname, 'src', 'server.js')
});

const command = process.argv[2];

switch(command) {
  case 'start':
    console.log('🚀 Starting CRM Backend Service...');
    svc.on('start', function() {
      console.log('✅ Service started successfully!');
      process.exit(0);
    });
    svc.start();
    break;
    
  case 'stop':
    console.log('🛑 Stopping CRM Backend Service...');
    svc.on('stop', function() {
      console.log('✅ Service stopped successfully!');
      process.exit(0);
    });
    svc.stop();
    break;
    
  case 'restart':
    console.log('🔄 Restarting CRM Backend Service...');
    svc.on('stop', function() {
      console.log('🛑 Service stopped');
      svc.start();
    });
    svc.on('start', function() {
      console.log('✅ Service restarted successfully!');
      process.exit(0);
    });
    svc.restart();
    break;
    
  case 'status':
    console.log('📊 Checking service status...');
    console.log(`Service Name: ${svc.name}`);
    console.log(`Service exists: ${svc.exists}`);
    process.exit(0);
    break;
    
  default:
    console.log('❌ Invalid command. Available commands:');
    console.log('   node service-control.js start');
    console.log('   node service-control.js stop');
    console.log('   node service-control.js restart');
    console.log('   node service-control.js status');
    process.exit(1);
}

svc.on('error', function(err) {
  console.error('❌ Service operation failed:', err);
  process.exit(1);
});