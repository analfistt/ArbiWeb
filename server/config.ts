// Centralized configuration module for environment variables

export const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  
  // App
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5000",
  
  // Authentication
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  
  // NOWPayments
  nowPayments: {
    apiKey: process.env.NOWPAYMENTS_API_KEY || "",
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || "",
    apiUrl: "https://api.nowpayments.io/v1",
    sandboxMode: !process.env.NOWPAYMENTS_API_KEY, // Use sandbox if no API key
  },
  
  // WebSocket
  wsSecret: process.env.WS_SECRET || process.env.JWT_SECRET || "ws-secret-change-in-production",
};

// Validate required environment variables in production
if (config.nodeEnv === "production") {
  const required = [
    "JWT_SECRET",
    "APP_BASE_URL",
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(", ")}`);
    console.warn("⚠️  App will run but some features may not work correctly");
  }
  
  if (!config.nowPayments.apiKey) {
    console.warn("⚠️  NOWPAYMENTS_API_KEY not set - deposits will run in demo mode");
  }
}

export default config;
