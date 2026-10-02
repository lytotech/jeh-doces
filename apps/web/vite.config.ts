import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { APP_VERSION } from './src/version';

const versionManifestPlugin = () => ({
  name: 'version-manifest',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ version: APP_VERSION }, null, 2),
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionManifestPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
