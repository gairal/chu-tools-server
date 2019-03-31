import * as Twit from 'twit';

import config from '../config';
import { IPost, PostType } from '../types';

export default class Twitter {
  public static format = (data: Twit.Twitter.Status[]): IPost[] => {
    return data.map(
      ({
        created_at,
        id_str,
        lang,
        full_text,
        retweet_count,
      }: Twit.Twitter.Status): IPost => ({
        lang,
        created: created_at,
        id: id_str,
        likes: retweet_count,
        text: full_text,
        type: PostType.Twitter,
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

  public async get(ids: string[]): Promise<IPost[]> {
    try {
      const result = await this.twit.get('statuses/lookup', {
        id: ids.join(','),
      });

      return Twitter.format(result.data as Twit.Twitter.Status[]);
    } catch (e) {
      const reason = new Error('failed searching tweets');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  }

  public async search(
    term: string,
    count: number = 50,
    maxId: string,
  ): Promise<IPost[]> {
    try {
      const result = await this.twit.get('search/tweets', {
        count,
        max_id: maxId,
        q: term,
        result_type: 'recent',
        tweet_mode: 'extended',
      });

      return Twitter.format(
        (result.data as Twit.Twitter.SearchResults).statuses,
      );
    } catch (e) {
      const reason = new Error('failed searching tweets');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  }
}
