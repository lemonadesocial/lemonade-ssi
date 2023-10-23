import * as prom from 'prom-client';
import type { FastifyPluginCallback, RouteHandlerMethod } from 'fastify';

prom.collectDefaultMetrics();

const handler: RouteHandlerMethod = async (_, reply) => {
  const payload = await prom.register.metrics();

  reply.type(prom.register.contentType).send(payload);
};

export const metricsPlugin: FastifyPluginCallback = (fastify, _, done) => {
  fastify.get('/metrics', handler);

  done();
};
