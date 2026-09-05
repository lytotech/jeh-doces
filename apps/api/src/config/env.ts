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
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  mercadoPagoWebhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL || '',
  mercadoPagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  otelEnabled: process.env.OTEL_ENABLED === 'true',
  otelMetricsUrl: process.env.OTEL_METRICS_URL || 'http://192.168.2.51:9090/api/v1/otlp/v1/metrics',
  otelTracesUrl: process.env.OTEL_TRACES_URL || 'http://192.168.2.51:4318/v1/traces',
};
