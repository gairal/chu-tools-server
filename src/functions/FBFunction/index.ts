import * as cors from 'cors';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import config from '../../config';
import Intent, { IIntent } from '../../intents/ChuIntent';

interface ICorsReturn {
  req: functions.Request;
  res: functions.Response;
}

interface IFunction {
  init(): functions.HttpsFunction;
}

interface IError extends Error {
  status?: number;
  authorized?: boolean;
}

export default abstract class FBFunction implements IFunction, IIntent {
  public static init<T extends FBFunction>(
    this: new () => T,
  ): functions.HttpsFunction {
    const fun = new this();
    return fun.init();
  }

  protected intent: Intent = null;
  private corsMiddelware = null;
  constructor(intent?: new () => Intent) {
    this.intent = intent ? new intent() : null;
    this.corsMiddelware = cors({
      origin: (origin: string, cb: any) => {
        if (
          ['http://localhost:3000', 'https://virtualchu.gairal.com'].indexOf(
            origin,
          ) !== -1
        ) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'));
        }
      },
    });
  }

  /**
   * Bind the function to Firebase Functions
   *
   * @returns
   * @memberof FBFunction
   */
  public init(): functions.HttpsFunction {
    return functions.https.onRequest((req, res) =>
      this.cors(req, res).then((ret: ICorsReturn) =>
        this.onRequest(ret.req, ret.res),
      ),
    );
  }

  public async request(
    token: admin.auth.DecodedIdToken,
    query?: functions.Request['query'],
  ): Promise<any> {
    return this.intent.request(token, query);
  }

  public async validateFirebaseIdToken(
    req: functions.Request,
  ): Promise<admin.auth.DecodedIdToken> {
    const err: IError = new Error('Unauthorized');
    err.status = 403;
    err.authorized = false;

    return new Promise((resolve, reject) => {
      if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer ')
      ) {
        reject(err);
        return;
      }

      const idToken: string = req.headers.authorization.split('Bearer ')[1];

      admin
        .auth()
        .verifyIdToken(idToken)
        .then(this.validateEmail)
        .then(resolve)
        .catch(error => {
          err.message = error.message;
          reject(err);
        });
    });
  }

  protected async onRequest(req: functions.Request, res: functions.Response) {
    try {
      const decodedIdToken: admin.auth.DecodedIdToken = await this.validateFirebaseIdToken(
        req,
      );
      const data = await this.request(decodedIdToken, req.query);
      res.send(data);
    } catch (err) {
      // tslint:disable-next-line no-console
      console.error(err);

      if (err.status) {
        const result = {
          authorized: true,
          message: err.message,
          status: err.status,
        };
        if (err.authorized !== undefined) result.authorized = err.authorized;
        res.status = err.status;
        res.send(result);
      } else throw new functions.https.HttpsError('unavailable', err);
    }
  }

  private cors(req: functions.Request, res: functions.Response) {
    return new Promise(resolve => {
      this.corsMiddelware(req, res, () => {
        resolve({ req, res });
      });
    });
  }

  private validateEmail(
    decodedIdToken: admin.auth.DecodedIdToken,
  ): Promise<admin.auth.DecodedIdToken> {
    const { email } = decodedIdToken;
    if (!email || config.authorizedEmails.indexOf(email) === -1) {
      return Promise.reject(new Error('Unauthorized User'));
    }
    return Promise.resolve(decodedIdToken);
  }
}
