const path = require('path');

const backendDirectory = path.resolve(__dirname, 'backend');

module.exports = {
  apps: [
    {
      name: 'cravingbites-backend',
      script: 'src/server.js',
      cwd: backendDirectory,
      instances: 1, // Or 'max' for cluster mode across all CPU cores
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      time: true
    }
  ]
};
