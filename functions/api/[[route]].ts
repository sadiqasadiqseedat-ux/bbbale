/**
 * Cloudflare Pages Function Catch-All Route for /api/*
 * Automatically executed on Cloudflare Pages runtime with D1 binding "env.DB"
 */

import { handleApiRequest, Env } from '../../src/server/apiHandler';

export const onRequest = async (context: { request: Request; env: Env }): Promise<Response> => {
  return handleApiRequest(context.request, context.env);
};
