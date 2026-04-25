import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LANGUAGES, getLanguage } from '../i18n/languages';
import { applyLangToDOM } from '../i18n';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = getLanguage(i18n.language);

  const select = (code: string) => {
    i18n.changeLanguage(code);
    applyLangToDOM(code);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        id="lang-switcher-btn"
        className="lang-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Switch language"
        aria-expanded={open}
      >
        <Globe size={15} />
        <span className="lang-btn-native">{current.nativeName}</span>
        <span className="lang-btn-code">{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <div className="lang-dropdown" role="listbox">
          <div className="lang-dropdown-header">
            <Globe size={12} /> Select Language
          </div>
          <div className="lang-list">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                id={`lang-${lang.code}`}
                role="option"
                aria-selected={lang.code === i18n.language}
                className={`lang-option ${lang.code === i18n.language ? 'lang-option-active' : ''} ${lang.rtl ? 'lang-rtl' : ''}`}
                onClick={() => select(lang.code)}
              >
                <span className="lang-native">{lang.nativeName}</span>
                <span className="lang-english">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
