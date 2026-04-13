const MessageType = {
  GET_SELECTION: 'PREPSNIPPET_BG_GET_SELECTION',
  ANALYZE: 'PREPSNIPPET_BG_ANALYZE',
  SAVE_SNIPPET: 'PREPSNIPPET_BG_SAVE_SNIPPET',
  GET_SETTINGS: 'PREPSNIPPET_BG_GET_SETTINGS',
  SAVE_SETTINGS: 'PREPSNIPPET_BG_SAVE_SETTINGS',
  GET_AUTH_STATUS: 'PREPSNIPPET_BG_GET_AUTH_STATUS',
  LOGIN: 'PREPSNIPPET_BG_LOGIN',
  SIGNUP: 'PREPSNIPPET_BG_SIGNUP',
  LOGOUT: 'PREPSNIPPET_BG_LOGOUT',
};

const LegacyMessageType = {
  GET_SELECTION: 'PREPSNIPPET_GET_SELECTION',
  ANALYZE: 'PREPSNIPPET_ANALYZE',
  SAVE_SNIPPET: 'PREPSNIPPET_SAVE_SNIPPET',
  GET_SETTINGS: 'PREPSNIPPET_GET_SETTINGS',
  SAVE_SETTINGS: 'PREPSNIPPET_SAVE_SETTINGS',
  GET_AUTH_STATUS: 'PREPSNIPPET_GET_AUTH_STATUS',
  LOGIN: 'PREPSNIPPET_LOGIN',
  SIGNUP: 'PREPSNIPPET_SIGNUP',
  LOGOUT: 'PREPSNIPPET_LOGOUT',
};

function sendMessageOnce(type, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!type) {
      const error = new Error('Missing message type.');
      error.code = 'REQUEST_FAILED';
      reject(error);
      return;
    }

    chrome.runtime.sendMessage({ type, payload }, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        const error = new Error(lastError.message || 'Chrome runtime error.');
        error.code = 'RUNTIME_ERROR';
        reject(error);
        return;
      }

      if (!response?.ok) {
        const error = new Error(response?.error || 'Request failed.');
        error.code = response?.errorCode || 'REQUEST_FAILED';
        reject(error);
        return;
      }

      resolve(response.data);
    });
  });
}

async function sendMessage(type, payload = {}, fallbackTypes = []) {
  let lastError;
  const allTypes = [type, ...fallbackTypes].filter(Boolean);

  for (const candidateType of allTypes) {
    try {
      return await sendMessageOnce(candidateType, payload);
    } catch (error) {
      lastError = error;
      const shouldTryNext = error.code === 'UNKNOWN_MESSAGE';
      if (!shouldTryNext) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Request failed.');
}

export function getSelection() {
  return sendMessage(MessageType.GET_SELECTION, {}, [LegacyMessageType.GET_SELECTION]);
}

export function analyzeCode(payload) {
  return sendMessage(MessageType.ANALYZE, payload, [LegacyMessageType.ANALYZE]);
}

export function saveSnippet(payload) {
  return sendMessage(MessageType.SAVE_SNIPPET, payload, [LegacyMessageType.SAVE_SNIPPET]);
}

export function getSettings() {
  return sendMessage(MessageType.GET_SETTINGS, {}, [LegacyMessageType.GET_SETTINGS]);
}

export function saveSettings(payload) {
  return sendMessage(MessageType.SAVE_SETTINGS, payload, [LegacyMessageType.SAVE_SETTINGS]);
}

export function getAuthStatus() {
  return sendMessage(MessageType.GET_AUTH_STATUS, {}, [LegacyMessageType.GET_AUTH_STATUS]);
}

export function login(payload) {
  return sendMessage(MessageType.LOGIN, payload, [LegacyMessageType.LOGIN]);
}

export function signup(payload) {
  return sendMessage(MessageType.SIGNUP, payload, [LegacyMessageType.SIGNUP]);
}

export function logout() {
  return sendMessage(MessageType.LOGOUT, {}, [LegacyMessageType.LOGOUT]);
}
