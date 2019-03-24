import * as admin from 'firebase-admin';

import Auth from './functions/Auth';
import Sheets from './functions/Sheets';
import Tweets from './functions/Tweets';

admin.initializeApp();

export const auth = Auth.init();
export const tweets = Tweets.init();
export const sheets = Sheets.init();
