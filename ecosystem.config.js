module.exports = {
    apps : [{
      name: "saidobadiss",
      script: "./src/server.ts",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      interpreter: "ts-node",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }]
  };