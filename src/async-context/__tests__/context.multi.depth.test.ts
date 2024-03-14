import { AsyncContainer } from '#/async-context/AsyncContainer';
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
  it('multi depth get-store with type', async () => {
    AsyncContainer.bootstrap({ resourceTypes: ['custom-type', 'custom-type-parent'] });

    const s1 = new AsyncLocalStorage();
    const type = 'custom-type-parent';

    async function asyncTest() {
      const s2 = new AsyncLocalStorage();

      await s2.run({ age: 11 }, async () => {
        const r2 = new AsyncResourceTest('custom-type');
        await r2.runInAsyncScope(async () => {
          const finded = AsyncContainer.it.getStore<AsyncResourceTest>(executionAsyncId(), type);
          expect(finded?.type).toEqual(type);
        });
      });
    }

    await s1.run({ name: 'dummy' }, async () => {
      const r1 = new AsyncResourceTest(type);
      await r1.runInAsyncScope(async () => {
        await asyncTest();
      });
    });
  });
});
