import 'dotenv/config';
import * as functions from 'firebase-functions';

const fbConfig = functions.config();

const config = {
  authorizedEmails: ['peperdro@gmail.com', 'unkrich.kristine@gmail.com'],
  google: {
    apiKey: fbConfig.google ? fbConfig.google.key : process.env.GOOGLE_KEY,
  },
  twitter: {
    accessToken: fbConfig.twitter
      ? fbConfig.twitter.accessToken
      : process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: fbConfig.twitter
      ? fbConfig.twitter.accessTokenSecret
      : process.env.TWITTER_ACCESS_TOKEN_SECRET,
    consumerKey: fbConfig.twitter
      ? fbConfig.twitter.consumerKey
      : process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: fbConfig.twitter
      ? fbConfig.twitter.consumerSecret
      : process.env.TWITTER_CONSUMER_SECRET,
  },
};

export default config;
