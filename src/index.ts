import * as admin from 'firebase-admin';

import Auth from './functions/Auth';
import Tweets from './functions/Tweets';

admin.initializeApp();

export const auth = Auth.init();
export const tweets = Tweets.init();
