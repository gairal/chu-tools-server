import * as admin from 'firebase-admin';
import { JWT } from 'google-auth-library';
import { google, sheets_v4, translate_v2 } from 'googleapis';

import { GaxiosResponse } from 'gaxios';
import config from '../config';
import { IAuthReturn } from '../functions/FBFunction';
import { ITweetStatus } from '../model/twitter';
import Intent from './ChuIntent';

interface ISheetDataDataUpdates {
  spreadsheetId: string;
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

interface ISheetDataData {
  updates: ISheetDataDataUpdates;
}

interface ISheetData {
  status: number;
  statusText: string;
  data: ISheetDataData;
}

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

  private apiKey: string = null;
  private sheets: sheets_v4.Sheets = null;
  private translate: translate_v2.Translate = null;
  private jwtClient: JWT = null;
  private db: FirebaseFirestore.Firestore = null;
  constructor() {
    super('sheet');

    this.apiKey = config.sheet.apiKey;
    this.sheets = google.sheets({ version: 'v4' });
    this.translate = google.translate({ version: 'v2' });
    this.jwtClient = new google.auth.JWT({
      email: config.sheet.email,
      key: config.sheet.privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/cloud-translation',
      ],
    });

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

      await this.jwtClient.authorize();
      const result = await this.sheets.spreadsheets.values.append({
        auth: this.jwtClient,
        key: this.apiKey,
        range: 'A1',
        requestBody: { values },
        spreadsheetId: params.spreadsheetId,
        valueInputOption: 'USER_ENTERED',
      });

      await this.persisteSaved(tweets);

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
        GaxiosResponse<translate_v2.Schema$TranslationsListResponse>
      >[] = tweetsByLanguages.map((v: ITweetStatus[], i: number) =>
        this.translate.translations.translate({
          auth: this.jwtClient,
          requestBody: {
            format: 'text',
            q: v.map((t: ITweetStatus) => t.text),
            source: mapping[i],
            target: 'en',
          },
        }),
      );

      const res = await Promise.all(promises);

      const ret = tweetsByLanguages.reduce((acc, lang: ITweetStatus[], i) => {
        lang.forEach((t, j) => {
          const currLang = res[i].data as any;
          // add the translation to the tweets
          t.translation = (currLang.data as translate_v2.Schema$TranslationsListResponse).translations[
            j
          ].translatedText;
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

  private getOrderedTweets = async (tweets: ITweetStatus[]) => {
    try {
      const ordered = tweets.reduce(
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

      return ordered;
    } catch (e) {
      const reason = new Error('failed searching tweets');
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  };
}
