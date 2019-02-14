import * as admin from 'firebase-admin';
import FBFunction from './FBFunction';

export default class Auth extends FBFunction {
  public async request(token: admin.auth.DecodedIdToken) {
    if (!token.name) {
      throw new Error('Auth Failed');
    }

    return {
      authorized: true,
      name: token.name,
      status: 200,
    };
  }
}
