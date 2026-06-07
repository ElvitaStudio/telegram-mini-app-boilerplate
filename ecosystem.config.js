module.exports = {
  apps: [
    {
      name: 'tma-frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'tma-backend',
      cwd: './backend',
      script: 'uvicorn',
      args: 'main:app --host 127.0.0.1 --port 8000 --workers 2',
      interpreter: '/usr/bin/python3',
      env: {
        PYTHONUNBUFFERED: '1',
      },
      max_memory_restart: '256M',
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'tma-bot',
      cwd: './backend',
      script: 'bot.py',
      interpreter: '/usr/bin/python3',
      env: {
        PYTHONUNBUFFERED: '1',
      },
      max_memory_restart: '128M',
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
}
