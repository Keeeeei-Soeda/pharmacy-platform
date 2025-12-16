module.exports = {
  apps: [
    {
      name: "pharmacy-backend",
      cwd: "./backend",
      script: "src/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "pharmacy-frontend",
      script: "npm",
      args: "start -- -p 3005",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
