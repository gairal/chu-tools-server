import * as Twit from 'twit';

import config from '../config';

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

export interface ITweetStatus {
  created_at: string;
  entities: ITweetEntities;
  id: number;
  id_str?: string;
  text: string;
  full_text?: string;
  url: string;
  retweet_count: number;
  lang: string;
  sentiment?: string;
  category?: string;
  translation?: string;
}

interface ITweetData {
  statuses: ITweetStatus[];
}

export default class Twitter {
  public static format = (data: ITweetStatus[]): ITweetStatus[] => {
    return data.map(
      ({
        created_at,
        entities,
        id,
        id_str,
        lang,
        full_text,
        retweet_count,
      }) => ({
        created_at,
        entities,
        id,
        id_str,
        lang,
        retweet_count,
        text: full_text,
        url: `https://twitter.com/user/status/${id_str}`,
      }),
    );
  };

  private twit: Twit = null;
  constructor() {
    this.twit = new Twit({
      app_only_auth: true,
      consumer_key: config.twitter.consumerKey,
      consumer_secret: config.twitter.consumerSecret,
      strictSSL: true,
    });
  }

  public async get(ids: string[]) {
    try {
      const result = await this.twit.get('statuses/lookup', {
        id: ids.join(','),
      });

      return Twitter.format(result.data as ITweetStatus[]);
    } catch (e) {
      const reason = new Error('failed searching tweets');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  }

  public async search(term: string, count: number = 50, maxId) {
    try {
      const result = await this.twit.get('search/tweets', {
        count,
        max_id: maxId,
        q: term,
        result_type: 'recent',
        tweet_mode: 'extended',
      });

      return Twitter.format((result.data as ITweetData)
        .statuses as ITweetStatus[]);
    } catch (e) {
      const reason = new Error('failed searching tweets');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  }
}
