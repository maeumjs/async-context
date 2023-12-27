import type { fastifyAsyncResourceSymbol } from '#/interfaces/fastifyAsyncResourceSymbol';
import type { FastifyRequest } from 'fastify';
import type { ApplicationHook, LifecycleHook } from 'fastify/types/hooks';
import type { AsyncResource } from 'node:async_hooks';

export interface RequestContextData {
  // Empty on purpose, to be extended by users of this module
}

export type RequestContextDataFactory = (req: FastifyRequest) => RequestContextData;

export interface RequestContext {
  get<K extends keyof RequestContextData>(key: K): RequestContextData[K] | undefined;
  set<K extends keyof RequestContextData>(key: K, value: RequestContextData[K]): void;
}

export type CreateAsyncResourceFactory<T extends AsyncResource = AsyncResource> = (
  req: FastifyRequest,
  context: RequestContext,
) => T;

export interface FastifyRequestContextOptions {
  defaultStoreValues?: RequestContextData | RequestContextDataFactory;
  hook?: ApplicationHook | LifecycleHook;
  createAsyncResource?: CreateAsyncResourceFactory;
}

declare module 'fastify' {
  export interface FastifyRequest {
    [fastifyAsyncResourceSymbol]: AsyncResource;
    requestContext: RequestContext;
  }
}
