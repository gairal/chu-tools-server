import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as queryString from 'query-string';

export interface IIntent {
  request(
    token: admin.auth.DecodedIdToken,
    query?: functions.Request['query'],
  ): Promise<any>;
}

export interface IConf {
  api?: string;
  axios?: AxiosRequestConfig;
}

export default abstract class Intent implements IIntent {
  public static get<T extends Intent>(
    this: new () => T,
    token: admin.auth.DecodedIdToken,
    params?: any,
  ): Promise<any> {
    const intent = new this();
    return intent.request(token, params);
  }

  protected conf: IConf = {
    api: null,
    axios: {},
  };
  protected httpClient: AxiosInstance = null;
  constructor(conf?: IConf) {
    this.conf = conf;
    if (conf && conf.axios) this.httpClient = axios.create(this.conf.axios);
  }

  public abstract async request(
    token: admin.auth.DecodedIdToken,
    query?: functions.Request['query'],
  ): Promise<any>;

  protected get apiUrl(): string {
    return this.conf.api;
  }

  protected async getRest(params: any = {}): Promise<{ data: any }> {
    return new Promise<{ data: any }>((resolve: any, reject: any) => {
      const qs = queryString.stringify(params);
      this.httpClient
        .get(`${this.apiUrl}?${qs}`)
        .then(res => resolve(res))
        .catch(reject);
    });
  }
}
