(() => {
  'use strict';

  const CONFIG_EVENT = '__yt_keyboard_blocker_config_v1__';

  const DEFAULT_BLOCKED = [
    'Space',
    'KeyK',
    'KeyJ',
    'KeyL',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'KeyM',
    'KeyF',
    'KeyC',
    'KeyT',
    'KeyI',
    'Home',
    'End',
    'Comma',
    'Period',
    'Slash',
    'Digit0',
    'Digit1',
    'Digit2',
    'Digit3',
    'Digit4',
    'Digit5',
    'Digit6',
    'Digit7',
    'Digit8',
    'Digit9',
    'NumLock',
    'Numpad0',
    'Numpad1',
    'Numpad2',
    'Numpad3',
    'Numpad4',
    'Numpad5',
    'Numpad6',
    'Numpad7',
    'Numpad8',
    'Numpad9',
    'NumpadDecimal',
    'NumpadComma',
    'NumpadAdd',
    'NumpadSubtract',
    'NumpadMultiply',
    'NumpadDivide',
    'NumpadEnter',
    'NumpadEqual',
    'NumpadParenLeft',
    'NumpadParenRight',
    'NumpadBackspace',
    'NumpadClear',
    'NumpadClearEntry',
    'Shift+KeyN',
    'Shift+KeyP',
    'Shift+Slash'
  ];

  let config = {
    enabled: true,
    mode: 'selected',
    blocked: DEFAULT_BLOCKED,
    allowed: [],
    blockInEditable: false,
    preventDefault: true
  };

  function normalizeConfig(candidate) {
    if (!candidate || typeof candidate !== 'object') return config;

    return {
      enabled: candidate.enabled !== false,
      mode: candidate.mode === 'all' ? 'all' : 'selected',
      blocked: Array.isArray(candidate.blocked) ? candidate.blocked : DEFAULT_BLOCKED,
      allowed: Array.isArray(candidate.allowed) ? candidate.allowed : [],
      blockInEditable: candidate.blockInEditable === true,
      preventDefault: candidate.preventDefault !== false
    };
  }

  function signatureFromEvent(event) {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    let code = event.code;
    if (!code) {
      const key = event.key || 'Unidentified';
      code = `Key:${key}`;
    }

    parts.push(code);
    return parts.join('+');
  }

  function isEditableTarget(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];

    return path.some((node) => {
      if (!(node instanceof Element)) return false;

      const tag = node.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (node.isContentEditable) return true;
      if (node.getAttribute('contenteditable') === 'true') return true;
      if (node.getAttribute('role') === 'textbox') return true;

      return false;
    });
  }

  function shouldBlock(event) {
    if (!config.enabled) return false;
    if (!config.blockInEditable && isEditableTarget(event)) return false;

    const signature = signatureFromEvent(event);

    if (config.mode === 'all') {
      return !config.allowed.includes(signature);
    }

    return config.blocked.includes(signature);
  }

  function intercept(event) {
    if (!shouldBlock(event)) return;

    if (config.preventDefault && event.cancelable) {
      event.preventDefault();
    }

    event.stopImmediatePropagation();
    event.stopPropagation();
  }

  // Capture sur window + document. Le handler window arrive avant les handlers
  // habituels de YouTube, et document sert de seconde barrière.
  for (const type of ['keydown', 'keypress', 'keyup']) {
    window.addEventListener(type, intercept, { capture: true, passive: false });
    document.addEventListener(type, intercept, { capture: true, passive: false });
  }

  window.addEventListener(CONFIG_EVENT, (event) => {
    try {
      const next = JSON.parse(event.detail);
      config = normalizeConfig(next);
    } catch (_) {
      // Configuration invalide : on conserve la dernière configuration valide.
    }
  }, true);
})();
