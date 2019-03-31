import * as admin from 'firebase-admin';
import { sheets_v4, translate_v2 } from 'googleapis';

import SheetWriter, { ISheetData } from '../clients/SheetWriter';
import Translator from '../clients/Translator';
import { ITweet } from '../clients/Twitter';
import { IAuthReturn } from '../functions/FBFunction';
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

  public async request(
    auth: IAuthReturn,
    params: ISheetParam,
    tweets: ITweet[],
  ) {
    try {
      const translatedTweets = await this.translateTweets(tweets);
      const values = await this.getOrderedTweets(translatedTweets);

      const result = await this.sheetWriter.write(params.spreadsheetId, values);

      await this.persisteSaved(tweets);

      return Sheet.format(result as ISheetData);
    } catch (e) {
      console.error({ e, auth, params }, 'error while saving to GSheet');
      return null;
    }
  }

  private translateTweets = async (tweets: ITweet[]) => {
    try {
      const splitTweets = tweets.reduce(
        (acc, t) => {
          if (['en', 'und'].includes(t.lang) || !!t.translation) {
            acc.untranslatable.push(t);
          } else {
            acc.translatable.push(t);
          }

          return acc;
        },
        { translatable: [], untranslatable: [] },
      );

      const mapping: string[] = [];
      const tweetsByLanguages = splitTweets.translatable.reduce((acc, t) => {
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
      >[] = tweetsByLanguages.map((v: ITweet[], i: number) =>
        this.translator.translate(mapping[i], v.map((t: ITweet) => t.text)),
      );

      const res = await Promise.all(promises);

      const ret = tweetsByLanguages.reduce((
        acc: ITweet[],
        lang: ITweet[],
        i: number,
      ) => {
        lang.forEach((t, j) => {
          // add the translation to the tweets
          t.translation = res[i][j].translatedText;
        });
        return acc.concat(lang);
      }, []);

      return splitTweets.untranslatable.concat(ret);
    } catch (e) {
      const reason = new Error('failed translating tweets');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  };

  private persisteSaved = async (tweets: ITweet[]) => {
    const tweetsIds = tweets.map(t => t.id);

    try {
      const batch = this.db.batch();
      const collection = this.db.collection('savedTweets');
      tweetsIds.forEach(id => {
        const doc = collection.doc(id);
        batch.set(doc, {});
      });

      await batch.commit();

      return tweetsIds;
    } catch (e) {
      const reason = new Error('failed persisting saved tweets');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  };

  private getOrderedTweets = (
    tweets: ITweet[],
  ): sheets_v4.Schema$ValueRange => {
    try {
      const values = tweets.reduce(
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
      const reason = new Error('failed searching tweets');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  };
}
