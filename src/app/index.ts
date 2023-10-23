import fastify from 'fastify'
import fastifyCors from '@fastify/cors';

import { logger } from './helpers/pino';

import * as admin from './services/admin';
import * as db from './helpers/db';

import { livezPlugin } from './plugins/livez';

export async function createApp() {
  const app = fastify({
    logger,
    trustProxy: true,
  });

  app.addHook('onReady', async () => {
    try {
      await db.connect();

      await admin.start();
    } catch (err) {
      app.log.fatal(err);
      process.exit(1);
    }
  });

  app.addHook('onClose', async () => {
    await db.disconnect();

    await admin.stop();
  });

  await app.register(fastifyCors, {
    credentials: true,
    origin: true,
  });

  await app.register(livezPlugin);

  return app;
}
