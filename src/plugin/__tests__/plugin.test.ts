import { getAddress, initApp } from '#/plugin/__tests__/internal/FastifyService';
import axios from 'axios';
import type { FastifyInstance } from 'fastify';
import { sleep } from 'my-easy-fp';
import { AsyncResource } from 'node:async_hooks';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('requestContext with const requestContext', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = initApp({ defaultStoreValues: { id: 'dummy' } });
    server.get('/t1', async (req) => {
      const rc = req.requestContext as unknown as {
        get: (key: string) => string;
        set: (key: string, value: string) => void;
      };

      rc.set('name', 'ironman');

      return {
        id: rc.get('id'),
        name: rc.get('name'),
      };
    });

    await server.listen({ port: 0, host: '127.0.0.1' });
    await sleep(100);
  });

  it('get/set', async () => {
    const url = `${getAddress(server)}/t1`;

    const reply = await axios.get<unknown, { data: { id: string; name: string } }>(url, {
      validateStatus: () => true,
    });

    expect(reply.data.id).toEqual('dummy');
    expect(reply.data.name).toEqual('ironman');
  });

  afterAll(async () => {
    await server.close();
  });
});

describe('requestContext with function requestContext', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = initApp({ hook: 'preParsing', defaultStoreValues: (req) => ({ id: req.id }) });
    server.get('/t2', async (req) => {
      const rc = req.requestContext as unknown as {
        get: (key: string) => string;
        set: (key: string, value: string) => void;
      };

      rc.set('name', req.id);

      return {
        id: rc.get('id'),
        name: rc.get('name'),
      };
    });

    await server.listen({ port: 0, host: '127.0.0.1' });
    await sleep(100);
  });

  it('get/set', async () => {
    const url = `${getAddress(server)}/t2`;

    const reply = await axios.get<unknown, { data: { id: string; name: string } }>(url, {
      validateStatus: () => true,
    });

    expect(reply.data.id).toEqual(reply.data.name);
  });

  afterAll(async () => {
    await server.close();
  });
});

class IdAsyncResource extends AsyncResource {
  #id: string;

  constructor(type: string, id: string) {
    super(type);
    this.#id = id;
  }

  get id() {
    return this.#id;
  }

  set id(value) {
    this.#id = value;
  }
}

describe('requestContext with custom async resource', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = initApp({
      defaultStoreValues: { id: 'dummy' },
      createAsyncResource: () => new IdAsyncResource('custom-resource-type', 'dummy'),
    });

    server.get('/t3', async (req) => {
      const rc = req.requestContext as unknown as {
        get: (key: string) => string;
        set: (key: string, value: string) => void;
      };

      rc.set('name', 'dummy');

      return {
        id: rc.get('id'),
        name: rc.get('name'),
      };
    });

    await server.listen({ port: 0, host: '127.0.0.1' });
    await sleep(100);
  });

  it('get/set', async () => {
    const url = `${getAddress(server)}/t3`;

    const reply = await axios.get<unknown, { data: { id: string; name: string } }>(url, {
      validateStatus: () => true,
    });

    expect(reply.data.id).toEqual(reply.data.name);
  });

  afterAll(async () => {
    await server.close();
  });
});
