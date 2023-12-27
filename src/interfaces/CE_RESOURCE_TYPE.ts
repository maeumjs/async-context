export const CE_RESOURCE_TYPE = {
  PLUGIN: 'fastify-request-context',
} as const;

export type CE_RESOURCE_TYPE = (typeof CE_RESOURCE_TYPE)[keyof typeof CE_RESOURCE_TYPE];
