import * as fastify from 'fastify';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { IncomingMessage } from 'http';
const fast = fastify();

admin.initializeApp();

import Auth from './functions/Auth';
import Tweet from './functions/Tweet';

const route = async (
  request: fastify.FastifyRequest<
    IncomingMessage,
    fastify.DefaultQuery,
    fastify.DefaultParams,
    fastify.DefaultHeaders,
    any
  >,
  FunctionType: any,
  params?: any,
) => {
  try {
    const fun = new FunctionType();
    const decodedIdToken = await fun.validateFirebaseIdToken(
      request.req as functions.Request,
    );
    return await fun.request(decodedIdToken, params);
  } catch (err) {
    return err;
  }
};

fast.get('/auth', async request => {
  return route(request, Auth);
});

fast.get('/Tweet', async request => {
  return route(request, Tweet, request.query as { q: string });
});

const start = async () => {
  try {
    await fast.listen(8080);
  } catch (err) {
    fast.log.error(err);
    process.exit(1);
  }
};
start();