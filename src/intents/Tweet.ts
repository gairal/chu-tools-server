import TrashClient from '../clients/Trash';
import Twitter from '../clients/Twitter';
import { IAuthReturn } from '../functions/FBFunction';
import Intent from './ChuIntent';

interface ITweetParam {
  count: number;
  max_id?: string;
  term: string;
}

export default class Tweet extends Intent {
  private twitter: Twitter = null;
  private trash: TrashClient = null;
  constructor() {
    super('tweet');
    this.twitter = new Twitter();
    this.trash = new TrashClient();
  }

  public async request(
    _: IAuthReturn,
    { term, count, max_id }: ITweetParam = { term: 'linkedin', count: 50 },
  ) {
    try {
      const results = await Promise.all([
        this.twitter.search(term, count, max_id),
        this.trash.get(),
      ]);

      const tweets = results[0];
      const trashedtweets = results[1];

      tweets.forEach(t => {
        if (trashedtweets.includes(t.id_str)) {
          t.hidden = true;
        }
      });
      return tweets;
    } catch (e) {
      console.error({ e, term, count, max_id }, 'error while getting tweets');
      return null;
    }
  }
}
