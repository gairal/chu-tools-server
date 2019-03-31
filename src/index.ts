import * as admin from 'firebase-admin';

import Auth from './functions/Auth';
import Reddits from './functions/Reddits';
import Sheets from './functions/Sheets';
import Translates from './functions/Translates';
import Trashes from './functions/Trashes';
import Tweets from './functions/Tweets';

admin.initializeApp();

export const auth = Auth.init();
export const tweets = Tweets.init();
export const reddits = Reddits.init();
export const sheets = Sheets.init();
export const translates = Translates.init();
export const trashes = Trashes.init();
