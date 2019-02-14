import * as admin from 'firebase-admin';
import * as Twit from 'twit';
import config from '../config';
import Intent from './ChuIntent';

interface ICookingParam {
  ingredient: string;
}

export default class Tweet extends Intent {
  public twit: Twit = null;
  constructor() {
    super();

    this.twit = new Twit({
      access_token: config.twitter.accessToken,
      access_token_secret: config.twitter.accessTokenSecret,
      consumer_key: config.twitter.consumerKey,
      consumer_secret: config.twitter.consumerSecret,
      strictSSL: true,
    });
  }

  public async request(
    token: admin.auth.DecodedIdToken,
    q: ICookingParam = { ingredient: 'salt' },
  ) {
    try {
      const result = await this.twit.get('search/tweets', {
        count: 100,
        q: 'banana since:2011-07-11',
      });
      console.log(result);

      return {
        result,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}
