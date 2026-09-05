import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { env } from './config/env';

let sdk: NodeSDK | undefined;

if (env.otelEnabled) {
  sdk = new NodeSDK({
    serviceName: 'confeiti-api',
    traceExporter: new OTLPTraceExporter({ url: env.otelTracesUrl }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: env.otelMetricsUrl }),
      exportIntervalMillis: 15000,
    }),
    instrumentations: [getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    })],
  });
  void sdk.start();
  process.once('SIGTERM', () => { void sdk?.shutdown(); });
  process.once('SIGINT', () => { void sdk?.shutdown(); });
}

export { sdk as telemetrySdk };
