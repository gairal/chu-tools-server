import Translator from '../clients/Translator';
import { IAuthReturn } from '../functions/FBFunction';
import Intent from './ChuIntent';

interface ITranslateParam {
  source: string;
  q: string;
}

export default class Translate extends Intent {
  private translator: Translator = null;
  constructor() {
    super('translate');

    this.translator = new Translator();
  }

  public async request(_: IAuthReturn, { source, q }: ITranslateParam) {
    try {
      const translations = await this.translator.translate(source, [q]);

      return translations[0];
    } catch (e) {
      console.error({ e, source, q }, 'error while getting translation');
      return null;
    }
  }
}
