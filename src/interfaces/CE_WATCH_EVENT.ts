export const CE_WATCH_EVENT = {
  INIT: 'INIT',
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  DESTROY: 'DESTROY',
  PROMISE_RESOLVE: 'PROMISE_RESOLVE',
} as const;

export type CE_WATCH_EVENT = (typeof CE_WATCH_EVENT)[keyof typeof CE_WATCH_EVENT];
