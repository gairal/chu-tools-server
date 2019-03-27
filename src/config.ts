import { Logging } from '@google-cloud/logging';
import 'dotenv/config';
import * as functions from 'firebase-functions';

const fbConfig = functions.config();

const config = {
  authorizedEmails: [
    'peperdro@gmail.com',
    'unkrich.kristine@gmail.com',
    'frank@autofi.io',
  ],
  logging: new Logging(),
  sheet: {
    apiKey: fbConfig.sheet ? fbConfig.sheet.key : process.env.SHEET_KEY,
    email: fbConfig.sheet
      ? fbConfig.sheet.email
      : process.env.SHEET_SERVICE_ACCOUNT_EMAIL,
    privateKey: fbConfig.sheet
      ? fbConfig.sheet.private_key
      : process.env.SHEET_SERVICE_ACCOUNT_PRIVATE_KEY,
  },
  twitter: {
    consumerKey: fbConfig.twitter
      ? fbConfig.twitter.consumer_key
      : process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: fbConfig.twitter
      ? fbConfig.twitter.consumer_secret
      : process.env.TWITTER_CONSUMER_SECRET,
  },
};

export default config;
