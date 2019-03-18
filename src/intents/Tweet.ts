import * as admin from 'firebase-admin';
import * as Twit from 'twit';
import config from '../config';
import Intent from './ChuIntent';

interface ITweetParam {
  term: string;
}

export default class Tweet extends Intent {
  public twit: Twit = null;
  constructor() {
    super();

    this.twit = new Twit({
      app_only_auth: true,
      consumer_key: config.twitter.consumerKey,
      consumer_secret: config.twitter.consumerSecret,
      strictSSL: true,
    });
  }

  public async request(
    token: admin.auth.DecodedIdToken,
    q: ITweetParam = { term: 'linkedin' },
  ) {
    try {
      const result = await this.twit.get('search/tweets', {
        count: 100,
        q: q.term,
      });

      return {
        result,
      };
    } catch (err) {
      return null;
    }
  }
}
