import * as admin from 'firebase-admin';
import { GaxiosResponse } from 'gaxios';
import { sheets_v4, translate_v2 } from 'googleapis';

import { IAuthReturn } from '../functions/FBFunction';
import SheetWriter, { ISheetData } from '../model/SheetWriter';
import Translator from '../model/Translator';
import { ITweetStatus } from '../model/twitter';
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
    tweets: ITweetStatus[],
  ) {
    try {
      const translatedTweets = await this.translateTweets(tweets);
      const values = await this.getOrderedTweets(translatedTweets);

      const result = await this.sheetWriter.write(params.spreadsheetId, values);

      // await this.persisteSaved(tweets);

      return Sheet.format(result as ISheetData);
    } catch (e) {
      console.error({ e, auth, params }, 'error while saving to GSheet');
      return null;
    }
  }

  private translateTweets = async (tweets: ITweetStatus[]) => {
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

      const mapping = [];
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
      >[] = tweetsByLanguages.map((v: ITweetStatus[], i: number) =>
        this.translator.translate(
          mapping[i],
          v.map((t: ITweetStatus) => t.text),
        ),
      );

      const res = await Promise.all(promises);

      const ret = tweetsByLanguages.reduce((acc, lang: ITweetStatus[], i) => {
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

  private persisteSaved = async (tweets: ITweetStatus[]) => {
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
    tweets: ITweetStatus[],
  ): sheets_v4.Schema$ValueRange => {
    try {
      const values = tweets.reduce(
        (
          rows,
          { created_at, id, text, url, category, sentiment, translation },
        ) =>
          rows.concat([
            [
              id,
              Sheet.formatDate(created_at),
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
