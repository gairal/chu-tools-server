import { IAuthReturn } from '../functions/FBFunction';
import Twitter from '../model/twitter';
import Intent from './ChuIntent';

interface ITweetParam {
  term: string;
  count: number;
}

export default class Tweet extends Intent {
  private twitter: Twitter = null;
  constructor() {
    super('tweet');
    this.twitter = new Twitter();
  }

  public async request(
    _: IAuthReturn,
    { term, count }: ITweetParam = { term: 'linkedin', count: 50 },
  ) {
    try {
      const tweets = await this.twitter.search(term, count);

      return tweets;
    } catch (e) {
      console.error({ e, term, count }, 'error while getting tweets');
      return null;
    }
  }
}
