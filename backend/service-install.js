var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: 'CRM-Xilnex',
  description: 'CRM-Xilnex Service',
  script: 'C:\\Code\\cnph-crm-xilnex\\backend\\src\\server.js',
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    },
    {
      name: "PORT", 
      value: "5685"
    },
    {
      name: "MONGO_URI",
      value: "mongodb://192.168.100.19:27017/crm_database"
    },
    {
      name: "MONGODB_URI",
      value: "mongodb://192.168.100.19:27017/crm_database"
    },
    {
      name: "JWT_SECRET",
      value: "your_super_secret_jwt_key_here_change_in_production"
    },
    {
      name: "JWT_EXPIRE",
      value: "30d"
    },
    {
      name: "JWT_COOKIE_EXPIRE",
      value: "30"
    },
    {
      name: "FRONTEND_URL",
      value: "http://192.168.100.19:3310"
    },
    {
      name: "XILNEX_ENABLED",
      value: "true"
    },
    {
      name: "XILNEX_API_URL",
      value: "https://api.xilnex.com"
    },
    {
      name: "XILNEX_APPID",
      value: "BQ12k1mF3YWrbPQreZIpEmYbaLgjYzHG"
    },
    {
      name: "XILNEX_APPTOKEN",
      value: "v5_WPWlMeoVzCEZXrF5LQW/iuMMYW2EfnY80xvoHWgcz/o="
    },
    {
      name: "XILNEX_AUTH",
      value: "5"
    }
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  svc.start();
});

// Install the script as a service
svc.install();