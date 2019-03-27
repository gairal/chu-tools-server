import * as fastify from 'fastify';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { IncomingMessage } from 'http';

import Auth from './functions/Auth';
import Sheets from './functions/Sheets';
import Translates from './functions/Translates';
import Trashes from './functions/Trashes';
import Tweets from './functions/Tweets';

admin.initializeApp();
const fast = fastify();
fast.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (_, body, done) => {
    try {
      done(null, JSON.parse(body));
    } catch (err) {
      err.statusCode = 400;
      done(err, undefined);
    }
  },
);

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
  body?: any,
) => {
  try {
    const fun = new FunctionType();
    const auth = await fun.validateFirebaseIdToken(
      request.req as functions.Request,
    );
    return await fun.request(auth, params, body);
  } catch (err) {
    return err;
  }
};

fast.get('/auth', async request => {
  return route(request, Auth);
});

fast.get('/tweets', async request => {
  return route(request, Tweets, request.query as { q: string });
});

fast.get('/translates', async request => {
  return route(request, Translates, request.query as { q: string });
});

fast.post('/trashes', async request => {
  return route(request, Trashes, request.query as { q: string });
});

fast.post('/sheets', async request => {
  return route(
    request,
    Sheets,
    request.query as { q: string },
    request.body as any,
  );
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
