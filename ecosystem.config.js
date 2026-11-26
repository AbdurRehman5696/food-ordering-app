module.exports = {
  apps: [
    {
      name: 'cravingbites-backend',
      script: './backend/src/server.js',
      cwd: './',
      instances: 1, // Or 'max' for cluster mode across all CPU cores
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'postgresql://postgres:postgrespassword@localhost:5432/food_order_db?schema=public',
        JWT_SECRET: 'super_secret_jwt_key_for_devops_class_2026',
        CLIENT_URL: 'http://localhost'
      },
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      time: true
    }
  ]
};
