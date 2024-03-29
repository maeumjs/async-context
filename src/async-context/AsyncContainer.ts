import { AsyncWatcher } from '#/async-context/AsyncWatcher';
import { CE_RESOURCE_TYPE } from '#/interfaces/CE_RESOURCE_TYPE';
import { CE_WATCH_EVENT } from '#/interfaces/CE_WATCH_EVENT';
import type { IAsyncContainerOptions } from '#/interfaces/IAsyncContainerOptions';
import type { AsyncResource } from 'node:async_hooks';
import type { SetOptional } from 'type-fest';

export class AsyncContainer {
  static #it: AsyncContainer;

  static get it(): Readonly<AsyncContainer> {
    return this.#it;
  }

  static #isBootstrap: boolean = false;

  static get isBootstrap(): Readonly<boolean> {
    return this.#isBootstrap;
  }

  static bootstrap(options?: SetOptional<IAsyncContainerOptions, keyof IAsyncContainerOptions>) {
    if (!AsyncContainer.#isBootstrap) {
      AsyncContainer.#it = new AsyncContainer(options);
      AsyncContainer.#isBootstrap = true;
    }
  }

  static setStore<T = AsyncResource>(asyncId: number, resource: T) {
    return AsyncContainer.#it.setStore<T>(asyncId, resource);
  }

  static getStore<T = AsyncResource>(asyncId: number) {
    return AsyncContainer.#it.getStore<T>(asyncId);
  }

  static async getStoreAsync<T = AsyncResource>(asyncId: number) {
    return AsyncContainer.#it.getStoreAsync<T>(asyncId);
  }

  #idMap: Map<number, number>;

  #resourceMap: Map<number, object>;

  #resourceTypeMap: Map<number, string>;

  #watcher: AsyncWatcher;

  #options: IAsyncContainerOptions;

  constructor(options?: SetOptional<IAsyncContainerOptions, keyof IAsyncContainerOptions>) {
    this.#options = {
      searchGuard: options?.searchGuard ?? 100,
      resourceTypes: options?.resourceTypes ?? [CE_RESOURCE_TYPE.PLUGIN],
    };

    const typeMap = new Map<string, boolean>(
      this.#options.resourceTypes.map<[string, boolean]>((resourceType) => [resourceType, true]),
    );
    const idMap = new Map<number, number>();
    const resourceMap = new Map<number, object>();
    const resourceTypeMap = new Map<number, string>();
    const watcher = new AsyncWatcher();

    watcher
      .setupInitHook()
      .setupBeforeHook()
      .setupAfterHook()
      .setupDestroyHook()
      .setupPromiseResolveHook()
      .start()
      .on(
        CE_WATCH_EVENT.INIT,
        ({
          asyncId,
          type,
          resource,
          triggerAsyncId,
        }: {
          asyncId: number;
          type: string;
          triggerAsyncId: number;
          executionAsyncId: number;
          resource: object;
        }) => {
          idMap.set(asyncId, triggerAsyncId);

          if (typeMap.get(type) != null) {
            resourceMap.set(asyncId, resource);
            resourceTypeMap.set(asyncId, type);
          }
        },
      )
      .on(CE_WATCH_EVENT.DESTROY, ({ asyncId }: { asyncId: number; executionAsyncId: number }) => {
        idMap.delete(asyncId);
        resourceMap.delete(asyncId);
      });

    this.#idMap = idMap;
    this.#resourceMap = resourceMap;
    this.#resourceTypeMap = resourceTypeMap;
    this.#watcher = watcher;
  }

  get options(): Readonly<IAsyncContainerOptions> {
    return this.#options;
  }

  get watcher(): Readonly<AsyncWatcher> {
    return this.#watcher;
  }

  get entries(): Readonly<[number, number][]> {
    return Array.from(this.#idMap.entries());
  }

  setStore<T = AsyncResource>(asyncId: number, resource: T) {
    this.#resourceMap.set(asyncId, resource as object);
  }

  getStore<T = AsyncResource>(asyncId: number, type?: string) {
    let resource: object | undefined = this.#resourceMap.get(asyncId);

    if (resource != null && type != null) {
      const resourceType = this.#resourceTypeMap.get(asyncId);
      if (resourceType === type) {
        return resource as T;
      }
    }

    if (resource != null && type == null) {
      return resource as T;
    }

    let id = this.#idMap.get(asyncId);
    let sentinel = 0;

    while (id != null && sentinel < 1000) {
      resource = this.#resourceMap.get(id);

      if (resource != null && type != null) {
        const resourceType = this.#resourceTypeMap.get(id);
        if (resourceType === type) {
          return resource as T;
        }
      }

      if (resource != null && type == null) {
        return resource as T;
      }

      id = this.#idMap.get(id);
      sentinel += 1;
    }

    return undefined;
  }

  async getStoreAsync<T = AsyncResource>(asyncId: number, type?: string) {
    let resource: object | undefined = this.#resourceMap.get(asyncId);

    if (resource != null && type != null) {
      const resourceType = this.#resourceTypeMap.get(asyncId);
      if (resourceType === type) {
        return resource as T;
      }
    }

    if (resource != null && type == null) {
      return resource as T;
    }

    const finded = await new Promise<T | undefined>((resolve) => {
      const guard = this.options.searchGuard;
      let id = this.#idMap.get(asyncId);
      let sentinel = 0;

      const handle = setInterval(() => {
        if (id == null) {
          clearInterval(handle);
          resolve(undefined);
          return;
        }

        if (sentinel > guard) {
          clearInterval(handle);
          resolve(undefined);
          return;
        }

        resource = this.#resourceMap.get(id);

        if (resource != null && type != null) {
          const resourceType = this.#resourceTypeMap.get(id);
          if (resourceType === type) {
            clearInterval(handle);
            resolve(resource as T);
            return;
          }
        }

        if (resource != null && type == null) {
          clearInterval(handle);
          resolve(resource as T);
          return;
        }

        id = this.#idMap.get(id);
        sentinel += 1;
      });
    });

    return finded;
  }
}
