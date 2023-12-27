import { CE_RESOURCE_TYPE } from '#/interfaces/CE_RESOURCE_TYPE';
import { fastifyAsyncResourceSymbol } from '#/interfaces/fastifyAsyncResourceSymbol';
import type {
  FastifyRequestContextOptions,
  RequestContext,
  RequestContextData,
} from '#/interfaces/options';
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { AsyncLocalStorage, AsyncResource } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

const requestContext: RequestContext = {
  get: (key) => {
    const store = asyncLocalStorage.getStore();
    return store ? store[key] : undefined;
  },
  set: (key, value) => {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store[key] = value;
    }
  },
};

function fastifyRequestContextHandler(
  fastify: FastifyInstance,
  opts: FastifyRequestContextOptions,
  next: (err?: Error) => void,
) {
  fastify.decorate('requestContext', requestContext);
  fastify.decorateRequest('requestContext', { getter: () => requestContext });
  fastify.decorateRequest(fastifyAsyncResourceSymbol, null);

  const hook = opts.hook || 'onRequest';

  fastify.addHook(hook, (req: FastifyRequest, _res: FastifyReply, done: () => void) => {
    const defaultStoreValues: RequestContextData | undefined =
      typeof opts.defaultStoreValues === 'function'
        ? (opts.defaultStoreValues(req) as RequestContextData)
        : opts.defaultStoreValues;

    asyncLocalStorage.run({ ...defaultStoreValues }, () => {
      const asyncResource =
        opts.createAsyncResource != null
          ? opts.createAsyncResource(req, requestContext)
          : new AsyncResource(CE_RESOURCE_TYPE.PLUGIN);
      req[fastifyAsyncResourceSymbol] = asyncResource;
      asyncResource.runInAsyncScope(done, req.raw);
    });
  });

  // Both of onRequest and preParsing are executed after the als.runWith call within the "proper" async context (AsyncResource implicitly created by ALS).
  // However, preValidation, preHandler and the route handler are executed as a part of req.emit('end') call which happens
  // in a different async context, as req/res may emit events in a different context.
  // Related to https://github.com/nodejs/node/issues/34430 and https://github.com/nodejs/node/issues/33723
  if (hook === 'onRequest' || hook === 'preParsing') {
    fastify.addHook('preValidation', (req: FastifyRequest, _res: FastifyReply, done) => {
      const asyncResource = req[fastifyAsyncResourceSymbol];
      asyncResource.runInAsyncScope(done, req.raw);
    });
  }

  next();
}

export const maeumAsyncContext = fastifyPlugin(fastifyRequestContextHandler, {
  fastify: '4.x',
  name: '@maeum/async-context',
});
