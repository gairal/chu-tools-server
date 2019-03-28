import * as functions from 'firebase-functions';
import { IAuthReturn } from '../functions/FBFunction';

export interface IIntent {
  request(auth: IAuthReturn, query?: functions.Request['query']): Promise<any>;
}

export interface IConf {
  api?: string;
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
  constructor(name: string) {
    this.name = name;
  }

  public abstract async request(
    auth: IAuthReturn,
    query?: functions.Request['query'],
    body?: functions.Request['body'],
  ): Promise<any>;
}
