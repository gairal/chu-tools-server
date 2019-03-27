import TrashClient from '../clients/Trash';
import { IAuthReturn } from '../functions/FBFunction';
import Intent from './ChuIntent';

interface ITrashParam {
  id: string;
  untrash?: string;
}

export default class Trash extends Intent {
  private trash: TrashClient = null;
  constructor() {
    super('trash');
    this.trash = new TrashClient();
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
        res = await this.trash.save(id);
      } else {
        res = await this.trash.delete(id);
      }

      return res;
    } catch (e) {
      console.error({ e, id, untrash }, 'error while trashing tweet');
      return null;
    }
  }
}
