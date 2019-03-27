import { JWT } from 'google-auth-library';
import { google, sheets_v4 } from 'googleapis';

import { GaxiosResponse } from 'gaxios';
import config from '../config';

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

export interface ISheetData {
  status: number;
  statusText: string;
  data: ISheetDataData;
}

export default class Sheet {
  private apiKey: string = null;
  private sheets: sheets_v4.Sheets = null;
  private jwtClient: JWT = null;
  constructor() {
    this.apiKey = config.sheet.apiKey;
    this.sheets = google.sheets({ version: 'v4' });
    this.jwtClient = new google.auth.JWT({
      email: config.sheet.email,
      key: config.sheet.privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  public write(
    spreadsheetId: string,
    values: sheets_v4.Schema$ValueRange,
  ): Promise<GaxiosResponse<sheets_v4.Schema$AppendValuesResponse>> {
    // await this.jwtClient.authorize();
    return this.sheets.spreadsheets.values.append({
      spreadsheetId,
      auth: this.jwtClient,
      key: this.apiKey,
      range: 'A1',
      requestBody: values,
      valueInputOption: 'USER_ENTERED',
    });
  }
}
