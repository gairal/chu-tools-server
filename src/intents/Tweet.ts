import * as admin from 'firebase-admin';
import Twit from 'twit';
import config from '../config';
import Intent from './ChuIntent';

interface ICookingParam {
  ingredient: string;
}

export default class Tweet extends Intent {
  constructor() {
    super({
      api: config.cooking.uri,
      axios: {
        headers: {
          'Accept-Encoding': 'gzip',
        },
      },
    });

    this.twit = new Twit({
      access_token: config.twitter.accessToken,
      access_token_secret: config.twitter.accessTokenSecret,
      consumer_key: config.twitter.consumerKey,
      consumer_secret: config.twitter.consumerSecret,
      strictSSL: true,,
    });
  }

  public async request(
    token: admin.auth.DecodedIdToken,
    q: ICookingParam = { ingredient: 'salt' },
  ) {
    const { ingredient } = q;
    const data = await this.getRest({
      app_id: config.cooking.apiId,
      app_key: config.cooking.apiKey,
      q: ingredient ? ingredient : 'salt',
      to: 50,
    });

    const cooking = data.data;
    if (!cooking || !cooking.hits || !cooking.hits.length) {
      throw new Error('No Recipe Today');
    }

    const hits = cooking.hits;
    const randomIdx = Math.floor(Math.random() * Math.floor(hits.length));
    const { uri, label, image } = hits[randomIdx].recipe;

    return {
      imgs: [image],
      link: uri,
      text: label,
    };
  }
}
