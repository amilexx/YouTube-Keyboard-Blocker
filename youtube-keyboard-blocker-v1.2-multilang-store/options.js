'use strict';

const { t } = window.YKB_I18N;

const DEFAULT_BLOCKED = [
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
];

const CONFIG_VERSION = 2;

const DEFAULT_CONFIG = {
  configVersion: CONFIG_VERSION,
  enabled: true,
  mode: 'selected',
  blocked: DEFAULT_BLOCKED,
  allowed: [],
  blockInEditable: false,
  preventDefault: true
};

let config = structuredClone(DEFAULT_CONFIG);
let capturing = false;

const enabled = document.querySelector('#enabled');
const blockInEditable = document.querySelector('#blockInEditable');
const preventDefault = document.querySelector('#preventDefault');
const rules = document.querySelector('#rules');
const emptyState = document.querySelector('#emptyState');
const captureButton = document.querySelector('#captureButton');
const clearRules = document.querySelector('#clearRules');
const resetYoutube = document.querySelector('#resetYoutube');
const rulesTitle = document.querySelector('#rulesTitle');
const rulesDescription = document.querySelector('#rulesDescription');
const status = document.querySelector('#status');

function signatureFromEvent(event) {
  const parts = [];
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');
  parts.push(event.code || `Key:${event.key || 'Unidentified'}`);
  return parts.join('+');
}

function prettySignature(signature) {
  const names = {
    Space: t('keySpace'),
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    Comma: ',', Period: '.', Slash: '/',
    NumLock: t('keyNumLock'),
    NumpadDecimal: t('keyNumpadDecimal'), NumpadComma: t('keyNumpadComma'),
    NumpadAdd: t('keyNumpadAdd'), NumpadSubtract: t('keyNumpadSubtract'),
    NumpadMultiply: t('keyNumpadMultiply'), NumpadDivide: t('keyNumpadDivide'),
    NumpadEnter: t('keyNumpadEnter'), NumpadEqual: t('keyNumpadEqual'),
    NumpadParenLeft: t('keyNumpadParenLeft'), NumpadParenRight: t('keyNumpadParenRight'),
    NumpadBackspace: t('keyNumpadBackspace'), NumpadClear: t('keyNumpadClear'),
    NumpadClearEntry: t('keyNumpadClearEntry')
  };

  return signature.split('+').map((part) => {
    if (names[part]) return names[part];
    if (/^Numpad[0-9]$/.test(part)) return `${t('keyNumpad')} ${part.slice(-1)}`;
    if (/^Digit[0-9]$/.test(part)) return part.slice(-1);
    if (/^Key[A-Z]$/.test(part)) return part.slice(-1);
    return part;
  }).join('+');
}

function activeListName() {
  return config.mode === 'all' ? 'allowed' : 'blocked';
}

function activeList() {
  return config[activeListName()];
}

function setActiveList(next) {
  config[activeListName()] = [...new Set(next)].sort((a, b) => a.localeCompare(b));
}

function migrateConfig(saved) {
  const next = { ...DEFAULT_CONFIG, ...saved };

  if ((saved.configVersion ?? 1) < 2) {
    const numpadDefaults = DEFAULT_BLOCKED.filter((entry) =>
      entry === 'NumLock' || entry.startsWith('Numpad')
    );
    next.blocked = [...new Set([...(saved.blocked ?? DEFAULT_BLOCKED), ...numpadDefaults])];
    next.configVersion = CONFIG_VERSION;
  }

  return next;
}

async function save() {
  config.configVersion = CONFIG_VERSION;
  await chrome.storage.sync.set(config);
  status.textContent = t('statusSaved');
  clearTimeout(save._timer);
  save._timer = setTimeout(() => {
    status.textContent = t('statusAuto');
  }, 900);
}

function renderRules() {
  const list = activeList();
  rules.innerHTML = '';
  emptyState.hidden = list.length !== 0;

  if (config.mode === 'all') {
    rulesTitle.textContent = t('allowedExceptionsTitle');
    rulesDescription.textContent = t('allowedExceptionsDesc');
    resetYoutube.hidden = true;
  } else {
    rulesTitle.textContent = t('blockedKeysTitle');
    rulesDescription.textContent = t('blockedKeysDesc');
    resetYoutube.hidden = false;
  }

  for (const signature of list) {
    const item = document.createElement('div');
    item.className = 'rule';

    const key = document.createElement('kbd');
    key.textContent = prettySignature(signature);
    key.title = signature;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.title = t('removeRule');
    remove.addEventListener('click', async () => {
      setActiveList(activeList().filter((entry) => entry !== signature));
      renderRules();
      await save();
    });

    item.append(key, remove);
    rules.append(item);
  }
}

function render() {
  enabled.checked = config.enabled;
  blockInEditable.checked = config.blockInEditable;
  preventDefault.checked = config.preventDefault;

  document.querySelectorAll('input[name="mode"]').forEach((radio) => {
    radio.checked = radio.value === config.mode;
  });

  renderRules();
}

enabled.addEventListener('change', async () => {
  config.enabled = enabled.checked;
  await save();
});

blockInEditable.addEventListener('change', async () => {
  config.blockInEditable = blockInEditable.checked;
  await save();
});

preventDefault.addEventListener('change', async () => {
  config.preventDefault = preventDefault.checked;
  await save();
});

document.querySelectorAll('input[name="mode"]').forEach((radio) => {
  radio.addEventListener('change', async () => {
    if (!radio.checked) return;
    config.mode = radio.value;
    renderRules();
    await save();
  });
});

captureButton.addEventListener('click', () => {
  capturing = !capturing;
  captureButton.classList.toggle('listening', capturing);
  captureButton.textContent = capturing ? t('captureListening') : t('captureIdle');
  captureButton.focus();
});

window.addEventListener('keydown', async (event) => {
  if (!capturing) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const modifierOnly = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'];
  if (modifierOnly.includes(event.code)) return;

  const signature = signatureFromEvent(event);
  setActiveList([...activeList(), signature]);

  capturing = false;
  captureButton.classList.remove('listening');
  captureButton.textContent = t('captureIdle');
  renderRules();
  await save();
}, true);

clearRules.addEventListener('click', async () => {
  setActiveList([]);
  renderRules();
  await save();
});

resetYoutube.addEventListener('click', async () => {
  config.mode = 'selected';
  config.blocked = [...DEFAULT_BLOCKED];
  render();
  await save();
});

(async () => {
  const saved = await chrome.storage.sync.get(DEFAULT_CONFIG);
  config = migrateConfig(saved);
  if ((saved.configVersion ?? 1) < CONFIG_VERSION) {
    await chrome.storage.sync.set(config);
  }
  render();
})();
