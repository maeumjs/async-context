/* eslint-disable @typescript-eslint/no-floating-promises */
import type { FastifyRequestContextOptions } from '#/interfaces/options';
import { maeumAsyncContext } from '#/plugin/maeumAsyncContext';
import fastify, { type FastifyInstance } from 'fastify';
import { first } from 'my-easy-fp';

export function initApp(options: FastifyRequestContextOptions) {
  const app = fastify({ logger: true });
  app.register(maeumAsyncContext, options);
  return app;
}

export function getAddress(server: FastifyInstance) {
  const { address, port } = first(server.addresses());
  const url = `http://${address}:${port}`;
  return url;
}
