import { CE_WATCH_EVENT } from '#/interfaces/CE_WATCH_EVENT';
import async_hooks from 'node:async_hooks';
import { EventEmitter } from 'node:events';

export class AsyncWatcher extends EventEmitter {
  init?(asyncId: number, type: string, triggerAsyncId: number, resource: object): void;

  before?(asyncId: number): void;

  after?(asyncId: number): void;

  destroy?(asyncId: number): void;

  promiseResolve?(asyncId: number): void;

  setupInitHook() {
    // init is called during object construction. The resource may not have
    // completed construction when this callback runs, therefore all fields of the
    // resource referenced by "asyncId" may not have been populated.
    this.init = (asyncId, type, triggerAsyncId, resource) => {
      this.emit(CE_WATCH_EVENT.INIT, {
        asyncId,
        type,
        triggerAsyncId,
        executionAsyncId: async_hooks.executionAsyncId(),
        resource,
      });
    };

    return this;
  }

  setupBeforeHook() {
    // Before is called just before the resource's callback is called. It can be
    // called 0-N times for handles (e.g. TCPWrap), and will be called exactly 1
    // time for requests (e.g. FSReqCallback).
    this.before = (asyncId) => {
      this.emit(CE_WATCH_EVENT.BEFORE, {
        asyncId,
        executionAsyncId: async_hooks.executionAsyncId(),
      });
    };

    return this;
  }

  setupAfterHook() {
    // After is called just after the resource's callback has finished.
    this.after = (asyncId) => {
      this.emit(CE_WATCH_EVENT.AFTER, {
        asyncId,
        executionAsyncId: async_hooks.executionAsyncId(),
      });
    };
    return this;
  }

  setupDestroyHook() {
    // Destroy is called when an AsyncWrap instance is destroyed.
    this.destroy = (asyncId) => {
      this.emit(CE_WATCH_EVENT.DESTROY, {
        asyncId,
        executionAsyncId: async_hooks.executionAsyncId(),
      });
    };

    return this;
  }

  setupPromiseResolveHook() {
    // promiseResolve is called only for promise resources, when the
    // `resolve` function passed to the `Promise` constructor is invoked
    // (either directly or through other means of resolving a promise).
    this.promiseResolve = (asyncId) => {
      this.emit(CE_WATCH_EVENT.PROMISE_RESOLVE, {
        asyncId,
        executionAsyncId: async_hooks.executionAsyncId(),
      });
    };

    return this;
  }

  start() {
    // Create a new AsyncHook instance. All of these callbacks are optional.
    async_hooks
      .createHook({
        init: this.init?.bind(this),
        before: this.before?.bind(this),
        after: this.after?.bind(this),
        destroy: this.destroy?.bind(this),
        promiseResolve: this.promiseResolve?.bind(this),
      })
      .enable();

    return this;
  }
}
