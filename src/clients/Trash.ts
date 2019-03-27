import * as admin from 'firebase-admin';

export default class Trash {
  private db: FirebaseFirestore.Firestore = null;
  private collectionName: string = 'trashedTweets';
  constructor() {
    this.db = admin.firestore();
  }

  public async get(): Promise<string[]> {
    try {
      const res = await this.db.collection(this.collectionName).get();

      const ids: string[] = [];
      res.forEach(
        (doc: FirebaseFirestore.QueryDocumentSnapshot) => ids.push[doc.id],
      );

      return ids;
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
