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
      min_uptime: "10s",
      max_restarts: 15,
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // 自動再起動の強化設定
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true,
      // 定期的な再起動（毎日午前4時）
      cron_restart: "0 4 * * *",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "pharmacy-frontend",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      min_uptime: "10s",
      max_restarts: 15,
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // 自動再起動の強化設定
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
      shutdown_with_message: true,
      // 定期的な再起動（毎日午前4時5分）
      cron_restart: "5 4 * * *",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
