import fetch from 'node-fetch';
import * as snoowrap from 'snoowrap';

import config from '../config';
import { IPost, PostType } from '../types';

interface IRedditAccessToken {
  access_token: string;
  expires_in: string;
  error?: string;
  error_description?: string;
}

interface IExtendedSearchOptions extends snoowrap.SearchOptions {
  limit: number;
}

export default class Reddit {
  public static format = (
    data: snoowrap.Listing<snoowrap.Submission>,
  ): IPost[] => {
    return data.map(
      ({
        created,
        id,
        selftext,
        score,
        permalink,
        url,
      }: snoowrap.Submission): IPost => ({
        id,
        created: new Date(created).toString(),
        likes: score,
        text: selftext || url,
        type: PostType.Reddit,
        url: `https://www.reddit.com${permalink}`,
      }),
    );
  };

  private clientId: string = null;
  private clientSecret: string = null;
  private deviceId: string = null;
  constructor() {
    this.clientId = config.reddit.clientId;
    this.clientSecret = config.reddit.clientSecret;
    this.deviceId = config.reddit.deviceId;
  }

  public async search(query: string, limit: number = 50, maxId: string) {
    try {
      const accessToken = await this.getAccessToken();

      const r = new snoowrap({
        accessToken,
        userAgent: 'nodejs-app',
      });

      const res = await r.search({
        limit,
        query,
        sort: 'new',
      } as IExtendedSearchOptions);
      return Reddit.format(res);
    } catch (e) {
      const reason = new Error('failed searching tweets');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      const res = await fetch(
        `https://${this.clientId}:${
          this.clientSecret
        }@www.reddit.com/api/v1/access_token?grant_type=client_credentials&device_id=${
          this.deviceId
        }`,
        { method: 'POST' },
      );
      const accessToken: IRedditAccessToken = await res.json();

      if (accessToken.error) {
        throw new Error(
          `${accessToken.error} | ${accessToken.error_description}`,
        );
      }

      return accessToken.access_token;
    } catch (e) {
      const reason = new Error('failed getting reddit accessToken');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  }
}
