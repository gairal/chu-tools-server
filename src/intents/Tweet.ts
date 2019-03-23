import * as admin from 'firebase-admin';
import * as Twit from 'twit';
import config from '../config';
import Intent from './ChuIntent';

interface ITweetParam {
  term: string;
  count: number;
}

interface ITweeturls {
  url: string;
  expanded_url: string;
  indices: number[];
}

interface ITweetHashtag {
  text: string;
  indices: number[];
}

interface ITweetEntities {
  hashtags: ITweetHashtag[];
  urls: ITweeturls[];
}

interface ITweetStatus {
  created_at: Date;
  entities: ITweetEntities;
  id: number;
  text: string;
  url: string;
}

interface ITweetData {
  statuses: ITweetStatus[];
}

const format = (data: ITweetData): ITweetStatus[] => {
  return data.statuses.map(({ created_at, entities, id, text }) => ({
    created_at,
    entities,
    id,
    text,
    url: `https://twitter.com/user/status/${id}`,
  }));
};

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
    _: admin.auth.DecodedIdToken,
    q: ITweetParam = { term: 'linkedin', count: 50 },
  ) {
    try {
      const result = await this.twit.get('search/tweets', {
        count: q.count,
        q: q.term,
      });

      return format(result.data as ITweetData);
    } catch (err) {
      return null;
    }
  }
}
