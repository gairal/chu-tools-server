import * as admin from 'firebase-admin';

import Auth from './functions/Auth';
import Tweet from './functions/Tweet';

admin.initializeApp();

export const auth = Auth.init();

export const tweet = Tweet.init();
