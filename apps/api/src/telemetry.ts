import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { metrics } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { env } from './config/env';

let sdk: NodeSDK | undefined;

const meter = metrics.getMeter('confeiti-api');
export const billingProviderFailures = meter.createCounter('confeiti_billing_provider_failures', {
  description: 'Falhas ao chamar o provedor de pagamentos.',
});

if (env.otelEnabled) {
  sdk = new NodeSDK({
    serviceName: 'confeiti-api',
    traceExporter: new OTLPTraceExporter({ url: env.otelTracesUrl }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: env.otelMetricsUrl }),
      exportIntervalMillis: 15000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
  void sdk.start();
  process.once('SIGTERM', () => {
    void sdk?.shutdown();
  });
  process.once('SIGINT', () => {
    void sdk?.shutdown();
  });
}

export { sdk as telemetrySdk };
