import * as admin from 'firebase-admin';

export default class Trash {
  private db: FirebaseFirestore.Firestore = null;
  private collectionName: string = 'trashedTweets';
  constructor() {
    this.db = admin.firestore();
  }

  public async get(ids?: string[]): Promise<string[]> {
    try {
      let res: FirebaseFirestore.DocumentSnapshot[];
      if (ids && ids.length) {
        res = await this.db.getAll(
          ...ids.map(id => this.db.collection(this.collectionName).doc(id)),
        );
      } else {
        const all = await this.db.collection(this.collectionName).get();
        res = all.docs;
      }

      const resultIds: string[] = res.filter(d => !!d && !!d.id).map(d => d.id);

      return resultIds;
    } catch (e) {
      const reason = new Error(`failed getting trash`);
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  }

  public async save(id: string): Promise<FirebaseFirestore.WriteResult> {
    try {
      const res = await this.db
        .collection(this.collectionName)
        .doc(id)
        .set({});

      return res;
    } catch (e) {
      const reason = new Error(`failed saving trash | id: ${id}`);
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  }

  public async delete(id: string): Promise<FirebaseFirestore.WriteResult> {
    try {
      const res = await this.db
        .collection(this.collectionName)
        .doc(id)
        .delete();

      return res;
    } catch (e) {
      const reason = new Error(`failed deleteing trash | id: ${id}`);
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  }
}
