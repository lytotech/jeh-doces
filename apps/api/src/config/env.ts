export const env = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || '0.0.0.0',
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
};
