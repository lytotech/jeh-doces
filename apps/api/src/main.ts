import os from 'node:os';
import { app } from './app';
import { env } from './config/env';

function getLocalIpAddress() {
  const addresses: string[] = [];
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const address of interfaces || []) {
      if (address.family === 'IPv4' && !address.internal) addresses.push(address.address);
    }
  }
  return addresses;
}

export function startServer() {
  app.listen(env.port, env.host, () => {
    console.log(`\n🧁 CONFEITI • API rodando na porta ${env.port}`);
    console.log(`🏠 Local: http://localhost:${env.port}`);
    getLocalIpAddress().forEach(ip => console.log(`📱 Rede: http://${ip}:${env.port}`));
  });
}
