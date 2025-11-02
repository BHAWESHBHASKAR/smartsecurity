module.exports = {
  apps: [
    {
      name: 'smart-security-backend',
      script: 'backend/dist/server.js',
      cwd: '/opt/smart-security',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'smart-security-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/opt/smart-security/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'mediamtx',
      script: './mediamtx/mediamtx',
      args: 'mediamtx-config.yml',
      cwd: '/opt/smart-security',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M'
    }
  ]
};
