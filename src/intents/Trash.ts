import * as admin from 'firebase-admin';

import { IAuthReturn } from '../functions/FBFunction';
import Intent from './ChuIntent';

interface ITrashParam {
  id: string;
  untrash?: string;
}

export default class Trash extends Intent {
  private db: FirebaseFirestore.Firestore = null;
  constructor() {
    super('trash');
    this.db = admin.firestore();
  }

  public async request(
    _: IAuthReturn,
    { id, untrash }: ITrashParam = { id, untrash: '0' },
  ) {
    const isUntrash: boolean = !!+untrash
      .replace('true', '1')
      .replace('false', '0');

    try {
      let res: FirebaseFirestore.WriteResult;
      if (!isUntrash) {
        res = await this.db
          .collection('trashedTweets')
          .doc(id)
          .set({});
      } else {
        res = await this.db
          .collection('trashedTweets')
          .doc(id)
          .delete();
      }

      return res;
    } catch (e) {
      console.error({ e, id, untrash }, 'error while trashing tweet');
      return null;
    }
  }
}
