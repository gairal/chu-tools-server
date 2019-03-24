import FBFunction, { IAuthReturn } from './FBFunction';

export default class Auth extends FBFunction {
  public async request(auth: IAuthReturn) {
    const { name } = auth.decodedIdToken;
    if (!name) {
      throw new Error('Auth Failed');
    }

    return {
      name,
      authorized: true,
      status: 200,
    };
  }
}
