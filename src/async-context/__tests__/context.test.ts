import { AsyncContainer } from '#/async-context/AsyncContainer';
import { CE_RESOURCE_TYPE } from '#/interfaces/CE_RESOURCE_TYPE';
import {
  AsyncLocalStorage,
  AsyncResource,
  executionAsyncId,
  type AsyncResourceOptions,
} from 'node:async_hooks';
import { describe, expect, it } from 'vitest';

class AsyncResourceTest extends AsyncResource {
  #type: string;

  get type() {
    return this.#type;
  }

  constructor(type: string, triggerAsyncId?: number | AsyncResourceOptions) {
    super(type, triggerAsyncId);
    this.#type = type;
  }
}

describe('requestContext with const requestContext', () => {
  it('constructor', () => {
    const c01 = new AsyncContainer({ searchGuard: 200 });
    const c02 = new AsyncContainer({ resourceTypes: ['custom-type'] });
    const c03 = new AsyncContainer();

    expect(c01.options.searchGuard).toEqual(200);
    expect(c02.options.resourceTypes).toEqual(['custom-type']);
    expect(c03.options.resourceTypes).toEqual([CE_RESOURCE_TYPE.PLUGIN]);
    expect(c03.options.searchGuard).toEqual(100);
    expect(c01.watcher).toBeDefined();
    expect(c01.entries).toBeDefined();
  });
});

describe('async-container', () => {
  it('singletone, bootstrap', () => {
    AsyncContainer.bootstrap({ resourceTypes: ['custom-type'] });
    expect(AsyncContainer.isBootstrap).toEqual(true);
  });

  it('single depth get-store', () => {
    AsyncContainer.bootstrap({ resourceTypes: ['custom-type'] });

    const storage = new AsyncLocalStorage();

    storage.run({ name: 'dummy' }, () => {
      const resource = new AsyncResourceTest('custom-type');
      resource.runInAsyncScope(() => {
        const finded = AsyncContainer.it.getStore(executionAsyncId());
        expect(finded instanceof AsyncResource).toBeTruthy();
      });
    });
  });

  it('multi depth get-store', async () => {
    AsyncContainer.bootstrap({ resourceTypes: ['custom-type'] });

    const s1 = new AsyncLocalStorage();

    async function asyncTest() {
      const s2 = new AsyncLocalStorage();

      await s2.run({ age: 11 }, async () => {
        const r2 = new AsyncResourceTest('custom-type');
        await r2.runInAsyncScope(async () => {
          const finded = AsyncContainer.it.getStore(executionAsyncId());
          expect(finded instanceof AsyncResource).toBeTruthy();
        });
      });
    }

    await s1.run({ name: 'dummy' }, async () => {
      const r1 = new AsyncResourceTest('custom-type');
      await r1.runInAsyncScope(async () => {
        await asyncTest();
      });
    });
  });
});
