import Tweet from '../intents/Tweet';
import FBFunction from './FBFunction';

export default class SecuredTweet extends FBFunction {
  constructor() {
    super(Tweet);
  }
}
