import * as admin from 'firebase-admin';
import { JWT } from 'google-auth-library';
import { customsearch_v1, google } from 'googleapis';
import Intent from '.';
import config from '../../config';

export enum SearchType {
  WEB,
  IMAGE,
}

export default class GoogleIntent extends Intent {
  private customsearch: customsearch_v1.Customsearch = null;
  private type: SearchType = null;
  constructor(type: SearchType = SearchType.WEB) {
    super();
    this.type = type;
    this.customsearch = google.customsearch('v1');
  }

  public async request(token: admin.auth.DecodedIdToken, { q }: { q: string }) {
    const cx =
      this.type === SearchType.IMAGE
        ? config.google.imageCseCX
        : config.google.cseCx;
    const params =
      this.type === SearchType.IMAGE
        ? {
            searchType: 'image',
          }
        : null;
    const data: any[] = await this.abstractSearch(q, cx, params);

    return this.render(data);
  }

  private render(results: any[]) {
    let text = '';
    switch (this.type) {
      case SearchType.IMAGE:
        text = results.reduce((acc: string, e: any) => {
          const { title, link } = e;
          const { thumbnailLink } = e.image;
          return `${acc}<a href="${link}" target="_blank" title="${title}"><img class="mb-2 mr-2" src="${thumbnailLink}" alt="${title}"/></a>`;
        }, '');
        break;
      default:
        text = results.reduce((acc: string, e: any) => {
          const { htmlTitle, link } = e;
          return `<div class="mb-2">${acc}${htmlTitle} <a href="${link}" target="_blank">[link]</a></div>`;
        }, '');
        text = `<div>${text}</div>`;
        break;
    }

    return {
      text,
    };
  }

  private abstractSearch(q: string, cx: string, params = {}) {
    return new Promise<any[]>((resolve, reject) => {
      this.getCse(q, cx, params)
        .then(data => {
          const results = data.data;
          if (!results || !results.items || !results.items.length) {
            reject(new Error('No Google Results'));
          }

          resolve(results.items);
        })
        .catch(reject);
    });
  }

  private async googleauth() {
    return google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/cse'],
    });
  }

  private async getApi(withAuth: boolean = false) {
    return new Promise((resolve, reject) => {
      if (!withAuth) resolve(config.google.apiKey);
      else {
        this.googleauth()
          .then(resolve)
          .catch(reject);
      }
    });
  }

  private async getCse(q: string, cx: string, params = {}) {
    return new Promise<{ data: any }>((resolve, reject) => {
      this.getApi()
        .then((auth: JWT) =>
          this.customsearch.cse.list({
            ...params,
            auth,
            cx,
            q,
          }),
        )
        .then(res => resolve(res))
        .catch(reject);
    });
  }
}
