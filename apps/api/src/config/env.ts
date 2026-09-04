export const env = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || '0.0.0.0',
  trustProxy: process.env.TRUST_PROXY === 'true',
  rateLimit: {
    apiPerMinute: Number(process.env.RATE_LIMIT_API_PER_MINUTE || 120),
    authPerWindow: Number(process.env.RATE_LIMIT_AUTH || 5),
    invitePerHour: Number(process.env.RATE_LIMIT_INVITE || 3),
  },
  corsOrigins: (
    process.env.CORS_ORIGINS ||
    'http://localhost:5173,https://confeiti.com.br,https://www.confeiti.com.br'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
};
