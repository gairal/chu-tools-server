import { JWT } from 'google-auth-library';
import { google, translate_v2 } from 'googleapis';

import config from '../config';

export default class Translator {
  private translateClient: translate_v2.Translate = null;
  private jwtClient: JWT = null;
  constructor() {
    this.translateClient = google.translate({ version: 'v2' });
    this.jwtClient = new google.auth.JWT({
      email: config.sheet.email,
      key: config.sheet.privateKey,
      scopes: ['https://www.googleapis.com/auth/cloud-translation'],
    });
  }

  public async translate(
    source: string,
    q: string[],
  ): Promise<translate_v2.Schema$TranslationsResource[]> {
    try {
      const res = await this.translateClient.translations.translate({
        auth: this.jwtClient,
        requestBody: {
          q,
          source,
          format: 'text',
          target: 'en',
        },
      });

      return (res.data as any).data
        .translations as translate_v2.Schema$TranslationsResource[];
    } catch (e) {
      const reason = new Error(
        `failed translating content | source: ${source} q: ${q}`,
      );
      reason.stack += `\nCaused By:\n ${e.stack}`;
      throw reason;
    }
  }
}
