'use strict';

const { t } = window.YKB_I18N;
const enabled = document.querySelector('#enabled');
const mode = document.querySelector('#mode');
const options = document.querySelector('#options');

async function refresh() {
  const config = await chrome.storage.sync.get({ enabled: true, mode: 'selected' });
  enabled.checked = config.enabled;
  mode.textContent = config.mode === 'all' ? t('popupModeAll') : t('popupModeSelected');
}

enabled.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: enabled.checked });
});

options.addEventListener('click', () => chrome.runtime.openOptionsPage());
refresh();
