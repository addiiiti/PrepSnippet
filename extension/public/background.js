const DEFAULT_API_BASE_URL = 'http://localhost:5000';

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

// Accept legacy/non-prefixed action names to avoid strict coupling between popup and worker versions.
const MessageTypeAliases = {
  PREPSNIPPET_GET_SELECTION: MessageType.GET_SELECTION,
  PREPSNIPPET_ANALYZE: MessageType.ANALYZE,
  PREPSNIPPET_SAVE_SNIPPET: MessageType.SAVE_SNIPPET,
  PREPSNIPPET_GET_SETTINGS: MessageType.GET_SETTINGS,
  PREPSNIPPET_SAVE_SETTINGS: MessageType.SAVE_SETTINGS,
  PREPSNIPPET_GET_AUTH_STATUS: MessageType.GET_AUTH_STATUS,
  PREPSNIPPET_LOGIN: MessageType.LOGIN,
  PREPSNIPPET_SIGNUP: MessageType.SIGNUP,
  PREPSNIPPET_LOGOUT: MessageType.LOGOUT,
  GET_SELECTION: MessageType.GET_SELECTION,
  ANALYZE: MessageType.ANALYZE,
  SAVE_SNIPPET: MessageType.SAVE_SNIPPET,
  GET_SETTINGS: MessageType.GET_SETTINGS,
  SAVE_SETTINGS: MessageType.SAVE_SETTINGS,
  GET_AUTH_STATUS: MessageType.GET_AUTH_STATUS,
  LOGIN: MessageType.LOGIN,
  SIGNUP: MessageType.SIGNUP,
  LOGOUT: MessageType.LOGOUT,
};

class ExtensionError extends Error {
  constructor(message, code = 'UNKNOWN') {
    super(message);
    this.code = code;
  }
}

function getIncomingMessageType(message) {
  const rawType = message?.type || message?.action || '';
  if (!rawType) return '';
  return MessageTypeAliases[rawType] || rawType;
}

function getIncomingPayload(message) {
  return message?.payload || message?.data || {};
}

async function getSettings() {
  const settings = await chrome.storage.sync.get(['apiBaseUrl']);
  return {
    apiBaseUrl: settings.apiBaseUrl || DEFAULT_API_BASE_URL,
  };
}

async function saveSettings(apiBaseUrl) {
  await chrome.storage.sync.set({
    apiBaseUrl: (apiBaseUrl || DEFAULT_API_BASE_URL).trim(),
  });
}

async function getAuthFromStorage() {
  const auth = await chrome.storage.local.get(['authToken', 'authUser']);
  return {
    authToken: auth.authToken || '',
    authUser: auth.authUser || null,
  };
}

async function persistAuth(token, user) {
  await chrome.storage.local.set({
    authToken: token,
    authUser: user,
  });
}

async function clearAuth() {
  await chrome.storage.local.remove(['authToken', 'authUser']);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function getSelectionFromActiveTab() {
  const tab = await getActiveTab();

  if (!tab?.id) {
    throw new ExtensionError('No active tab found.', 'NO_ACTIVE_TAB');
  }

  if (!tab.url || !/^https?:/i.test(tab.url)) {
    throw new ExtensionError('Selection is only supported on http/https pages.', 'INVALID_TAB_URL');
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'PREPSNIPPET_GET_SELECTION',
    });

    if (!response?.ok) {
      throw new ExtensionError(response?.error || 'Unable to read selected text.', 'SELECTION_FAILED');
    }

    return response.selectedCode || '';
  } catch (_error) {
    throw new ExtensionError('Unable to read selected text on this page.', 'SELECTION_FAILED');
  }
}

function withAuthHeaders(headers, authToken) {
  if (!authToken) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${authToken}`,
  };
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function normalizeFollowUpItem(item) {
  if (!item) return null;

  if (typeof item === 'string') {
    const question = item.trim();
    if (!question) return null;
    return { question, answer: '', intent: '' };
  }

  if (typeof item === 'object') {
    const question = String(item.question || item.title || '').trim();
    if (!question) return null;

    return {
      question,
      answer: String(item.answer || '').trim(),
      intent: String(item.intent || '').trim(),
    };
  }

  return null;
}

function normalizeAnalysisShape(analysis, legacy = {}) {
  const fallbackFollowUps = Array.isArray(legacy?.interviewQuestions)
    ? legacy.interviewQuestions
    : [];

  const followUpsSource =
    Array.isArray(analysis?.followUps) && analysis.followUps.length > 0
      ? analysis.followUps
      : fallbackFollowUps;

  const tagsSource =
    Array.isArray(analysis?.tags) && analysis.tags.length > 0 ? analysis.tags : legacy?.aiTags;

  const legacyComplexityReasoning = typeof legacy?.complexity === 'string' ? legacy.complexity : '';

  return {
    summary: String(analysis?.summary || legacy?.aiExplanation || '').trim(),
    pattern: String(analysis?.pattern || '').trim(),
    whyItWorks: String(analysis?.whyItWorks || '').trim(),
    interviewPitch30Sec: String(analysis?.interviewPitch30Sec || '').trim(),
    complexity: {
      time: String(analysis?.complexity?.time || legacy?.complexity?.time || '').trim(),
      space: String(analysis?.complexity?.space || legacy?.complexity?.space || '').trim(),
      reasoning: String(analysis?.complexity?.reasoning || legacyComplexityReasoning || '').trim(),
    },
    edgeCases: normalizeStringArray(analysis?.edgeCases),
    commonMistakes: normalizeStringArray(analysis?.commonMistakes),
    optimizations: normalizeStringArray(analysis?.optimizations),
    followUps: followUpsSource.map(normalizeFollowUpItem).filter(Boolean),
    tags: normalizeStringArray(tagsSource),
  };
}

function normalizeAnalysisPayload(apiData) {
  return normalizeAnalysisShape(apiData?.analysis || {}, apiData || {});
}

async function analyzeSnippet({ code, language }) {
  const { apiBaseUrl } = await getSettings();

  const response = await fetch(`${apiBaseUrl}/api/snippets/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, language }),
  });

  const payload = await parseJson(response);

  if (!response.ok || payload.success === false) {
    throw new ExtensionError(payload.message || 'Analyze request failed.', 'ANALYZE_FAILED');
  }

  return normalizeAnalysisPayload(payload.data);
}

function mapSavePayload({ title, code, language, analysis }) {
  const normalizedAnalysis = normalizeAnalysisShape(analysis || {});

  return {
    title,
    code,
    language,
    analysis: normalizedAnalysis,
  };
}

async function saveSnippet({ title, code, language, analysis }) {
  const { apiBaseUrl } = await getSettings();
  const { authToken } = await getAuthFromStorage();

  if (!authToken) {
    throw new ExtensionError('Login required to save snippets.', 'AUTH_REQUIRED');
  }

  const response = await fetch(`${apiBaseUrl}/api/snippets`, {
    method: 'POST',
    headers: withAuthHeaders(
      {
        'Content-Type': 'application/json',
      },
      authToken
    ),
    body: JSON.stringify(mapSavePayload({ title, code, language, analysis })),
  });

  const payload = await parseJson(response);

  if (response.status === 401 || payload.message === 'Not authorized, no token') {
    await clearAuth();
    throw new ExtensionError('Session expired. Please log in again.', 'AUTH_REQUIRED');
  }

  if (!response.ok || payload.success === false) {
    throw new ExtensionError(payload.message || 'Save request failed.', 'SAVE_FAILED');
  }

  return { id: payload?.data?.snippet?._id || null };
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new ExtensionError('Email and password are required.', 'VALIDATION_ERROR');
  }

  const { apiBaseUrl } = await getSettings();

  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await parseJson(response);
  if (!response.ok || payload.success === false) {
    throw new ExtensionError(payload.message || 'Login failed.', 'AUTH_FAILED');
  }

  const token = payload?.data?.token;
  const user = payload?.data?.user;

  if (!token || !user) {
    throw new ExtensionError('Invalid login response from server.', 'AUTH_FAILED');
  }

  await persistAuth(token, user);
  return { user };
}

async function signupUser({ name, email, password, college }) {
  if (!name || !email || !password) {
    throw new ExtensionError('Name, email, and password are required.', 'VALIDATION_ERROR');
  }

  const { apiBaseUrl } = await getSettings();

  const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password, college }),
  });

  const payload = await parseJson(response);
  if (!response.ok || payload.success === false) {
    throw new ExtensionError(payload.message || 'Signup failed.', 'AUTH_FAILED');
  }

  const token = payload?.data?.token;
  const user = payload?.data?.user;

  if (!token || !user) {
    throw new ExtensionError('Invalid signup response from server.', 'AUTH_FAILED');
  }

  await persistAuth(token, user);
  return { user };
}

async function getAuthStatus() {
  const { apiBaseUrl } = await getSettings();
  const { authToken, authUser } = await getAuthFromStorage();

  if (!authToken) {
    return { isAuthenticated: false, user: null };
  }

  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    method: 'GET',
    headers: withAuthHeaders({}, authToken),
  });

  const payload = await parseJson(response);
  if (!response.ok || payload.success === false) {
    if (response.status === 401) {
      await clearAuth();
      return { isAuthenticated: false, user: null };
    }

    // Soft fallback to locally cached user if profile check fails temporarily.
    return { isAuthenticated: true, user: authUser };
  }

  const user = payload?.data?.user || authUser;
  await persistAuth(authToken, user);
  return { isAuthenticated: true, user };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      const messageType = getIncomingMessageType(message);
      const payload = getIncomingPayload(message);

      if (messageType === MessageType.GET_SELECTION) {
        const selectedCode = await getSelectionFromActiveTab();
        sendResponse({ ok: true, data: { selectedCode } });
        return;
      }

      if (messageType === MessageType.GET_SETTINGS) {
        const settings = await getSettings();
        sendResponse({ ok: true, data: settings });
        return;
      }

      if (messageType === MessageType.SAVE_SETTINGS) {
        await saveSettings(payload?.apiBaseUrl);
        const settings = await getSettings();
        sendResponse({ ok: true, data: settings });
        return;
      }

      if (messageType === MessageType.GET_AUTH_STATUS) {
        const authState = await getAuthStatus();
        sendResponse({ ok: true, data: authState });
        return;
      }

      if (messageType === MessageType.LOGIN) {
        const authState = await loginUser(payload);
        sendResponse({ ok: true, data: authState });
        return;
      }

      if (messageType === MessageType.SIGNUP) {
        const authState = await signupUser(payload);
        sendResponse({ ok: true, data: authState });
        return;
      }

      if (messageType === MessageType.LOGOUT) {
        await clearAuth();
        sendResponse({ ok: true, data: { isAuthenticated: false, user: null } });
        return;
      }

      if (messageType === MessageType.ANALYZE) {
        const analysis = await analyzeSnippet(payload);
        sendResponse({ ok: true, data: analysis });
        return;
      }

      if (messageType === MessageType.SAVE_SNIPPET) {
        const result = await saveSnippet(payload);
        sendResponse({ ok: true, data: result });
        return;
      }

      sendResponse({
        ok: false,
        error: `Unknown message type: ${messageType || 'MISSING_TYPE'}`,
        errorCode: 'UNKNOWN_MESSAGE',
      });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error?.message || 'Unexpected extension error.',
        errorCode: error?.code || 'UNKNOWN',
      });
    }
  })();

  return true;
});
