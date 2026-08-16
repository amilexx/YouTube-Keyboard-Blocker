(() => {
  'use strict';

  const CONFIG_EVENT = '__yt_keyboard_blocker_config_v1__';

  const CONFIG_VERSION = 2;

  const DEFAULT_CONFIG = {
    configVersion: CONFIG_VERSION,
    enabled: true,
    mode: 'selected',
    blocked: [
      'Space', 'KeyK', 'KeyJ', 'KeyL',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'KeyM', 'KeyF', 'KeyC', 'KeyT', 'KeyI',
      'Home', 'End', 'Comma', 'Period', 'Slash',
      'Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4',
      'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9',
      'NumLock',
      'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4',
      'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9',
      'NumpadDecimal', 'NumpadComma', 'NumpadAdd', 'NumpadSubtract',
      'NumpadMultiply', 'NumpadDivide', 'NumpadEnter', 'NumpadEqual',
      'NumpadParenLeft', 'NumpadParenRight', 'NumpadBackspace',
      'NumpadClear', 'NumpadClearEntry',
      'Shift+KeyN', 'Shift+KeyP', 'Shift+Slash'
    ],
    allowed: [],
    blockInEditable: false,
    preventDefault: true
  };

  function sendConfig(config) {
    window.dispatchEvent(new CustomEvent(CONFIG_EVENT, {
      detail: JSON.stringify(config)
    }));
  }

  async function loadAndSend() {
    const saved = await chrome.storage.sync.get(DEFAULT_CONFIG);
    let next = saved;

    if ((saved.configVersion ?? 1) < CONFIG_VERSION) {
      const numpadDefaults = DEFAULT_CONFIG.blocked.filter((entry) =>
        entry === 'NumLock' || entry.startsWith('Numpad')
      );
      next = {
        ...saved,
        configVersion: CONFIG_VERSION,
        blocked: [...new Set([...(saved.blocked ?? DEFAULT_CONFIG.blocked), ...numpadDefaults])]
      };
      await chrome.storage.sync.set(next);
    }

    sendConfig(next);
  }

  loadAndSend();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return;

    const relevantKeys = ['configVersion', 'enabled', 'mode', 'blocked', 'allowed', 'blockInEditable', 'preventDefault'];
    if (!relevantKeys.some((key) => key in changes)) return;

    loadAndSend();
  });
})();
