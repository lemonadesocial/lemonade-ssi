import fastify from 'fastify'
import fastifyCors from '@fastify/cors';

import { logger } from './helpers/pino';

import * as admin from './services/admin';
import * as db from './helpers/db';
import * as network from './services/network';

import { livezPlugin } from './plugins/livez';
import { passportPlugin } from './plugins/passport';

export async function createApp() {
  const app = fastify({
    logger,
    trustProxy: true,
  });

  app.addHook('onReady', async () => {
    try {
      await db.connect();

      await Promise.all([
        admin.start(),
        network.init(),
      ]);
    } catch (err) {
      app.log.fatal(err);
      process.exit(1);
    }
  });

  app.addHook('onClose', async () => {
    await admin.stop();

    await db.disconnect();
  });

  await app.register(fastifyCors, {
    credentials: true,
    origin: true,
  });

  await app.register(livezPlugin);
  await app.register(passportPlugin);

  return app;
}
