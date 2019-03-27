import { IAuthReturn } from '../functions/FBFunction';
import Twitter from '../model/Twitter';
import Intent from './ChuIntent';

interface ITweetParam {
  count: number;
  max_id?: string;
  term: string;
}

export default class Tweet extends Intent {
  private twitter: Twitter = null;
  constructor() {
    super('tweet');
    this.twitter = new Twitter();
  }

  public async request(
    _: IAuthReturn,
    { term, count, max_id }: ITweetParam = { term: 'linkedin', count: 50 },
  ) {
    try {
      const tweets = await this.twitter.search(term, count, max_id);

      return tweets;
    } catch (e) {
      console.error({ e, term, count, max_id }, 'error while getting tweets');
      return null;
    }
  }
}
