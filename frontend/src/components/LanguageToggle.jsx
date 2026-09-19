import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const LanguageToggle = ({ variant = 'default' }) => {
  const { language, setLanguage, toggleLanguage, t } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        title={language === 'gu' ? 'Switch to English' : 'ગુજરાતીમાં બદલો'}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50/80 hover:bg-brand-50 hover:border-brand-200 text-xs font-bold text-gray-700 transition-all cursor-pointer shadow-2xs"
      >
        <Languages className="w-3.5 h-3.5 text-brand-600 shrink-0" />
        <span className={language === 'gu' ? 'text-brand-700 font-extrabold font-gujarati' : 'text-gray-400'}>
          ગુ
        </span>
        <span className="text-gray-300">/</span>
        <span className={language === 'en' ? 'text-brand-700 font-extrabold' : 'text-gray-400'}>
          EN
        </span>
      </button>
    );
  }

  // Card / Module Mode (For Profile & Admin Settings)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold shrink-0">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">
              {t('language.title')}
            </h4>
            <p className="text-[11px] text-gray-500">
              {t('language.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {/* Gujarati Option */}
        <button
          type="button"
          onClick={() => setLanguage('gu')}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer text-left ${
            language === 'gu'
              ? 'bg-gradient-to-r from-brand-50 to-indigo-50/60 border-brand-500 shadow-xs ring-2 ring-brand-500/20'
              : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-brand-100/80 text-brand-700 font-bold text-xs flex items-center justify-center font-gujarati">
              ગુ
            </span>
            <div>
              <span className={`text-xs font-bold block ${language === 'gu' ? 'text-brand-900' : 'text-gray-800'}`}>
                ગુજરાતી
              </span>
              <span className="text-[10px] text-gray-500">સરળ ભાષા</span>
            </div>
          </div>
          {language === 'gu' && (
            <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}
        </button>

        {/* English Option */}
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer text-left ${
            language === 'en'
              ? 'bg-gradient-to-r from-brand-50 to-indigo-50/60 border-brand-500 shadow-xs ring-2 ring-brand-500/20'
              : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 font-bold text-xs flex items-center justify-center">
              EN
            </span>
            <div>
              <span className={`text-xs font-bold block ${language === 'en' ? 'text-brand-900' : 'text-gray-800'}`}>
                English
              </span>
              <span className="text-[10px] text-gray-500">Standard</span>
            </div>
          </div>
          {language === 'en' && (
            <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
