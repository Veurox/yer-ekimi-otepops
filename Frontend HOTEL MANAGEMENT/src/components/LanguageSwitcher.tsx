import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('tr') ? 'tr' : 'en';

  const toggle = () => {
    i18n.changeLanguage(current === 'tr' ? 'en' : 'tr');
  };

  return (
    <button
      onClick={toggle}
      className="icon-btn"
      title={current === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
      style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.35rem 0.6rem', minWidth: 40 }}
    >
      {current === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
    </button>
  );
};

export default LanguageSwitcher;
