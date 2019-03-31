import * as admin from 'firebase-admin';
import { sheets_v4, translate_v2 } from 'googleapis';

import SheetWriter, { ISheetData } from '../clients/SheetWriter';
import Translator from '../clients/Translator';
import { IAuthReturn } from '../functions/FBFunction';
import { IPost } from '../types';
import Intent from './ChuIntent';

interface ISheetReturn {
  id: string;
  updatedCells: number;
  updatedColumns: number;
  updatedRange: string;
  updatedRows: number;
  status: string;
}

interface ISheetParam {
  spreadsheetId: string;
}

export default class Sheet extends Intent {
  public static format = (data: ISheetData): ISheetReturn => {
    const {
      statusText,
      data: {
        updates: {
          spreadsheetId,
          updatedRange,
          updatedRows,
          updatedColumns,
          updatedCells,
        },
      },
    } = data;

    return {
      updatedCells,
      updatedColumns,
      updatedRange,
      updatedRows,
      id: spreadsheetId,
      status: statusText,
    };
  };

  private static formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const mm = date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate();

    return [
      date.getFullYear(),
      (mm > 9 ? '' : '0') + mm,
      (dd > 9 ? '' : '0') + dd,
    ].join('/');
  };

  private sheetWriter: SheetWriter = null;
  private translator: Translator = null;
  private db: FirebaseFirestore.Firestore = null;
  constructor() {
    super('sheet');

    this.sheetWriter = new SheetWriter();
    this.translator = new Translator();

    this.db = admin.firestore();
  }

  public async request(auth: IAuthReturn, params: ISheetParam, posts: IPost[]) {
    try {
      const translatedPosts = await this.translatePosts(posts);
      const values = await this.getOrderedPosts(translatedPosts);

      const result = await this.sheetWriter.write(params.spreadsheetId, values);

      await this.persisteSaved(posts);

      return Sheet.format(result as ISheetData);
    } catch (e) {
      console.error({ e, auth, params }, 'error while saving to GSheet');
      return null;
    }
  }

  private translatePosts = async (posts: IPost[]) => {
    try {
      const splitPosts = posts.reduce(
        (acc, p) => {
          if (!p.lang || ['en', 'und'].includes(p.lang) || !!p.translation) {
            acc.untranslatable.push(p);
          } else {
            acc.translatable.push(p);
          }

          return acc;
        },
        { translatable: [], untranslatable: [] },
      );

      const mapping: string[] = [];
      const postsByLanguages = splitPosts.translatable.reduce((acc, t) => {
        if (!mapping.includes(t.lang)) {
          mapping.push(t.lang);
          acc[mapping.indexOf(t.lang)] = [];
        }

        acc[mapping.indexOf(t.lang)].push(t);
        return acc;
      }, []);

      // tslint:disable-next-line:array-type
      const promises: Promise<
        translate_v2.Schema$TranslationsResource[]
      >[] = postsByLanguages.map((v: IPost[], i: number) =>
        this.translator.translate(mapping[i], v.map((t: IPost) => t.text)),
      );

      const res = await Promise.all(promises);

      const ret = postsByLanguages.reduce((
        acc: IPost[],
        lang: IPost[],
        i: number,
      ) => {
        lang.forEach((t, j) => {
          // add the translation to the posts
          t.translation = res[i][j].translatedText;
        });
        return acc.concat(lang);
      }, []);

      return splitPosts.untranslatable.concat(ret);
    } catch (e) {
      const reason = new Error('failed translating post');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  };

  private persisteSaved = async (posts: IPost[]) => {
    const postsIds = posts.map(t => t.id);

    try {
      const batch = this.db.batch();
      const collection = this.db.collection('savedTweets');
      postsIds.forEach(id => {
        const doc = collection.doc(id);
        batch.set(doc, {});
      });

      await batch.commit();

      return postsIds;
    } catch (e) {
      const reason = new Error('failed persisting saved posts');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  };

  private getOrderedPosts = (posts: IPost[]): sheets_v4.Schema$ValueRange => {
    try {
      const values = posts.reduce(
        (rows, { created, id, text, url, category, sentiment, translation }) =>
          rows.concat([
            [
              id,
              Sheet.formatDate(created),
              text,
              translation,
              sentiment,
              category,
              url,
            ],
          ]),
        [],
      );

      return { values };
    } catch (e) {
      const reason = new Error('failed ordering posts');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  };
}
