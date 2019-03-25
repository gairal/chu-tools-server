import * as admin from 'firebase-admin';
import { JWT } from 'google-auth-library';
import { google, sheets_v4 } from 'googleapis';

import config from '../config';
import { IAuthReturn } from '../functions/FBFunction';
import Twitter, { ITweetStatus } from '../model/twitter';
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
  private jwtClient: JWT = null;
  private db: FirebaseFirestore.Firestore = null;
  constructor() {
    super('sheet');

    this.apiKey = config.sheet.apiKey;
    this.sheets = google.sheets({ version: 'v4' });
    this.jwtClient = new google.auth.JWT({
      email: config.sheet.email,
      key: config.sheet.privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.db = admin.firestore();
  }

  public async request(
    auth: IAuthReturn,
    params: ISheetParam,
    tweets: ITweetStatus[],
  ) {
    try {
      const values = await this.getOrderedTweets(tweets);

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
        (rows, { created_at, id, text, url, category, sentiment }) =>
          rows.concat([
            [
              id,
              Sheet.formatDate(created_at),
              text,
              null,
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
