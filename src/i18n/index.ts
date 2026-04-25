import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en  from './locales/en.json';
import hi  from './locales/hi.json';
import bn  from './locales/bn.json';
import te  from './locales/te.json';
import mr  from './locales/mr.json';
import ta  from './locales/ta.json';
import gu  from './locales/gu.json';
import kn  from './locales/kn.json';
import ml  from './locales/ml.json';
import or  from './locales/or.json';
import pa  from './locales/pa.json';
import ur  from './locales/ur.json';
import as_ from './locales/as.json';
import mai from './locales/mai.json';
import ne  from './locales/ne.json';
import kok from './locales/kok.json';
import sd  from './locales/sd.json';
import ks  from './locales/ks.json';
import dgo from './locales/dgo.json';
import mni from './locales/mni.json';
import brx from './locales/brx.json';
import sa  from './locales/sa.json';
import sat from './locales/sat.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en:  { translation: en  },
      hi:  { translation: hi  },
      bn:  { translation: bn  },
      te:  { translation: te  },
      mr:  { translation: mr  },
      ta:  { translation: ta  },
      gu:  { translation: gu  },
      kn:  { translation: kn  },
      ml:  { translation: ml  },
      or:  { translation: or  },
      pa:  { translation: pa  },
      ur:  { translation: ur  },
      as:  { translation: as_ },
      mai: { translation: mai },
      ne:  { translation: ne  },
      kok: { translation: kok },
      sd:  { translation: sd  },
      ks:  { translation: ks  },
      dgo: { translation: dgo },
      mni: { translation: mni },
      brx: { translation: brx },
      sa:  { translation: sa  },
      sat: { translation: sat },
    },
    fallbackLng: 'en',
    lng: localStorage.getItem('vyaparsetu_lang') ?? 'en',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'] },
  });

/** Apply RTL and font when language changes */
export function applyLangToDOM(code: string) {
  const rtl = ['ur', 'ks', 'sd'].includes(code);
  document.documentElement.dir  = rtl ? 'rtl' : 'ltr';
  document.documentElement.lang = code;
  localStorage.setItem('vyaparsetu_lang', code);
}

export default i18n;
