import RedditClient from '../clients/Reddit';
import TrashClient from '../clients/Trash';
import { IAuthReturn } from '../functions/FBFunction';
import Intent from './ChuIntent';

interface ILRedditParam {
  count: number;
  max_id?: string;
  term: string;
}

export default class Reddit extends Intent {
  private reddit: RedditClient = null;
  private trash: TrashClient = null;
  constructor() {
    super('reddit');
    this.reddit = new RedditClient();
    this.trash = new TrashClient();
  }

  public async request(
    _: IAuthReturn,
    { term, count, max_id }: ILRedditParam = { term: 'linkedin', count: 50 },
  ) {
    try {
      const posts = await this.reddit.search(`"${term}"`, +count, max_id);
      const trashedPosts = await this.trash.get(posts.map(t => t.id));

      posts.forEach(t => {
        if (trashedPosts.includes(p.id)) {
          p.hidden = true;
        }
      });

      return posts;
    } catch (e) {
      console.error({ e, term, count, max_id }, 'error while getting reddits');
      return null;
    }
  }
}
