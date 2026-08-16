(() => {
  'use strict';

  function t(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions) || key;
  }

  function apply() {
    const uiLanguage = chrome.i18n.getUILanguage();
    if (uiLanguage) document.documentElement.lang = uiLanguage.replace('_', '-');
    document.title = t('extName');

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
      element.title = t(element.dataset.i18nTitle);
    });
  }

  window.YKB_I18N = { t, apply };
  apply();
})();
