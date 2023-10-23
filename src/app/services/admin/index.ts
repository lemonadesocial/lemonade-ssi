import fastify, { FastifyInstance } from 'fastify'
import type { BaseLogger } from 'pino';

import { logger } from '../../helpers/pino';

import { metricsPlugin } from './plugins/metrics';

let app: FastifyInstance | undefined;

export async function start() {
  app = fastify({
    logger: logger.child({ service: 'admin' }) as BaseLogger,
    trustProxy: true,
  });

  await app.register(metricsPlugin);

  await app.listen({ host: '0.0.0.0', port: 8080 });
}

export async function stop() {
  if (app) await app.close();
}
