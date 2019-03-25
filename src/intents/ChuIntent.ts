import { Log } from '@google-cloud/logging';
import { AxiosRequestConfig } from 'axios';
import * as functions from 'firebase-functions';
import config from '../config';
import { IAuthReturn } from '../functions/FBFunction';

export interface IIntent {
  request(auth: IAuthReturn, query?: functions.Request['query']): Promise<any>;
}

export interface IConf {
  api?: string;
  axios?: AxiosRequestConfig;
}

export default abstract class Intent implements IIntent {
  public static get<T extends Intent>(
    this: new () => T,
    auth: IAuthReturn,
    params?: any,
  ): Promise<any> {
    const intent = new this();
    return intent.request(auth, params);
  }

  protected name: string = null;
  protected log: Log = null;
  constructor(name: string) {
    this.name = name;
    this.log = config.logging.log(name);
  }

  public abstract async request(
    auth: IAuthReturn,
    query?: functions.Request['query'],
    body?: functions.Request['body'],
  ): Promise<any>;
}
