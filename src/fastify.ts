import * as fastify from 'fastify';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { IncomingMessage } from 'http';
const fast = fastify();

admin.initializeApp();

import Auth from './functions/Auth';
import Bot from './functions/Bot';
import Cat from './functions/Cat';
import Cooking from './functions/Cooking';
import Gif from './functions/Gif';
import Google from './functions/Google';
import Image from './functions/Image';
import Joke from './functions/Joke';
import Message from './functions/Message';

import Weather from './functions/Weather';
import Wikipedia from './functions/Wikipedia';

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

fast.get('/bot', async request => {
  return route(request, Bot, request.query as { q: string });
});

fast.get('/cat', async request => {
  return route(request, Cat);
});

fast.get('/joke', async request => {
  return route(request, Joke);
});

fast.get('/gif', async request => {
  return route(request, Gif);
});

fast.get('/cooking', async request => {
  return route(request, Cooking);
});

fast.get('/weather', async request => {
  return route(request, Weather);
});

fast.get('/wikipedia', async request => {
  return route(request, Wikipedia, { q: 'choux' });
});

fast.get('/google', async request => {
  return route(request, Google, { q: 'choux' });
});

fast.get('/image', async request => {
  return route(request, Image, { q: 'choux' });
});

fast.get('/message', async request => {
  return route(request, Message, { q: 'choux' });
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
