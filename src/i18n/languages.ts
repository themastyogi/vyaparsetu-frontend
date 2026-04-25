export interface Language {
  code: string;
  name: string;       // English name
  nativeName: string; // Native script
  script: string;
  rtl: boolean;
  font?: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en',  name: 'English',    nativeName: 'English',       script: 'Latin',      rtl: false },
  { code: 'hi',  name: 'Hindi',      nativeName: 'हिंदी',          script: 'Devanagari', rtl: false, font: 'Noto Sans Devanagari' },
  { code: 'bn',  name: 'Bengali',    nativeName: 'বাংলা',          script: 'Bengali',    rtl: false, font: 'Noto Sans Bengali' },
  { code: 'te',  name: 'Telugu',     nativeName: 'తెలుగు',         script: 'Telugu',     rtl: false, font: 'Noto Sans Telugu' },
  { code: 'mr',  name: 'Marathi',    nativeName: 'मराठी',          script: 'Devanagari', rtl: false, font: 'Noto Sans Devanagari' },
  { code: 'ta',  name: 'Tamil',      nativeName: 'தமிழ்',          script: 'Tamil',      rtl: false, font: 'Noto Sans Tamil' },
  { code: 'gu',  name: 'Gujarati',   nativeName: 'ગુજરાતી',        script: 'Gujarati',   rtl: false, font: 'Noto Sans Gujarati' },
  { code: 'kn',  name: 'Kannada',    nativeName: 'ಕನ್ನಡ',          script: 'Kannada',    rtl: false, font: 'Noto Sans Kannada' },
  { code: 'ml',  name: 'Malayalam',  nativeName: 'മലയാളം',         script: 'Malayalam',  rtl: false, font: 'Noto Sans Malayalam' },
  { code: 'or',  name: 'Odia',       nativeName: 'ଓଡ଼ିଆ',          script: 'Odia',       rtl: false, font: 'Noto Sans Oriya' },
  { code: 'pa',  name: 'Punjabi',    nativeName: 'ਪੰਜਾਬੀ',         script: 'Gurmukhi',   rtl: false, font: 'Noto Sans Gurmukhi' },
  { code: 'ur',  name: 'Urdu',       nativeName: 'اردو',           script: 'Nastaliq',   rtl: true,  font: 'Noto Nastaliq Urdu' },
  { code: 'as',  name: 'Assamese',   nativeName: 'অসমীয়া',        script: 'Bengali',    rtl: false, font: 'Noto Sans Bengali' },
  { code: 'mai', name: 'Maithili',   nativeName: 'मैथिली',         script: 'Devanagari', rtl: false, font: 'Noto Sans Devanagari' },
  { code: 'ne',  name: 'Nepali',     nativeName: 'नेपाली',         script: 'Devanagari', rtl: false, font: 'Noto Sans Devanagari' },
  { code: 'kok', name: 'Konkani',    nativeName: 'कोंकणी',         script: 'Devanagari', rtl: false, font: 'Noto Sans Devanagari' },
  { code: 'sd',  name: 'Sindhi',     nativeName: 'سنڌي',           script: 'Arabic',     rtl: true,  font: 'Noto Nastaliq Urdu' },
  { code: 'ks',  name: 'Kashmiri',   nativeName: 'کٲشُر',          script: 'Arabic',     rtl: true,  font: 'Noto Nastaliq Urdu' },
  { code: 'dgo', name: 'Dogri',      nativeName: 'डोगरी',          script: 'Devanagari', rtl: false, font: 'Noto Sans Devanagari' },
  { code: 'mni', name: 'Manipuri',   nativeName: 'মৈতৈলোন্',       script: 'Bengali',    rtl: false, font: 'Noto Sans Bengali' },
  { code: 'brx', name: 'Bodo',       nativeName: 'बर\'',           script: 'Devanagari', rtl: false, font: 'Noto Sans Devanagari' },
  { code: 'sa',  name: 'Sanskrit',   nativeName: 'संस्कृतम्',      script: 'Devanagari', rtl: false, font: 'Noto Sans Devanagari' },
  { code: 'sat', name: 'Santhali',   nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',       script: 'Ol Chiki',   rtl: false, font: 'Noto Sans Ol Chiki' },
];

export const getLanguage = (code: string) =>
  LANGUAGES.find(l => l.code === code) ?? LANGUAGES[0];
