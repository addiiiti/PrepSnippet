import { useEffect, useMemo, useState } from 'react';
import AuthPanel from './components/AuthPanel';
import ResultView from './components/ResultView';
import SettingsPanel from './components/SettingsPanel';
import {
  analyzeCode,
  getAuthStatus,
  getSelection,
  getSettings,
  login,
  logout,
  saveSettings,
  saveSnippet,
  signup,
} from './services/extensionApi';
import { detectLikelyLanguage, truncateText } from './utils/formatters';

function inferTitleFromCode(code) {
  if (!code) return '';

  const firstContentLine = code
    .split('\n')
    .map((line) => line.trim())
    .find((line) => Boolean(line));

  if (!firstContentLine) return '';
  return firstContentLine.slice(0, 80);
}

export default function App() {
  const [selectedCode, setSelectedCode] = useState('');
  const [snippetTitle, setSnippetTitle] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:5000');
  const [authState, setAuthState] = useState({ isAuthenticated: false, user: null });

  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    college: '',
    email: '',
    password: '',
  });

  const [pendingSaveAfterAuth, setPendingSaveAfterAuth] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingSnippet, setIsSavingSnippet] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        setStatus({ type: 'loading', message: 'Loading selection...' });

        const [selectionData, settingsData] = await Promise.all([
          getSelection(),
          getSettings(),
        ]);

        setSelectedCode(selectionData.selectedCode || '');
        setSnippetTitle(inferTitleFromCode(selectionData.selectedCode || ''));
        setApiBaseUrl(settingsData.apiBaseUrl || 'http://localhost:5000');

        try {
          const authData = await getAuthStatus();
          setAuthState(normalizeAuthState(authData));
        } catch (_error) {
          setAuthState({ isAuthenticated: false, user: null });
        }

        if (selectionData.selectedCode) {
          setStatus({ type: 'idle', message: '' });
        } else {
          setStatus({
            type: 'empty',
            message: 'No text selected. Highlight code on the page and reopen the popup.',
          });
        }
      } catch (error) {
        setStatus({ type: 'error', message: error.message || 'Failed to initialize popup.' });
      }
    }

    bootstrap();
  }, []);

  const codePreview = useMemo(() => truncateText(selectedCode, 1200), [selectedCode]);

  function normalizeAuthState(authData) {
    return {
      isAuthenticated: Boolean(authData?.user),
      user: authData?.user || null,
    };
  }

  async function handleSaveFlow() {
    if (!analysis || !selectedCode.trim()) {
      setStatus({ type: 'error', message: 'Analyze code before saving.' });
      return;
    }

    if (!snippetTitle.trim()) {
      setStatus({ type: 'error', message: 'Enter a title before saving.' });
      return;
    }

    try {
      setIsSavingSnippet(true);
      setStatus({ type: 'loading', message: 'Saving snippet...' });

      await saveSnippet({
        title: snippetTitle.trim(),
        code: selectedCode,
        language: detectLikelyLanguage(selectedCode),
        analysis,
      });

      setStatus({
        type: 'success',
        message:
          'Snippet saved successfully. Go to https://addiiiti.github.io/PrepSnippet/ to view saved snippets.',
      });
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
        setAuthState({ isAuthenticated: false, user: null });
        setPendingSaveAfterAuth(true);
        setShowAuthPanel(true);
        setStatus({ type: 'empty', message: 'Please log in or sign up to save this snippet.' });
        return;
      }

      setStatus({ type: 'error', message: error.message || 'Save failed.' });
    } finally {
      setIsSavingSnippet(false);
    }
  }

  async function handleAnalyze() {
    if (!selectedCode.trim()) {
      setStatus({ type: 'empty', message: 'Select some code first.' });
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysis(null);
      setStatus({ type: 'loading', message: 'Analyzing snippet...' });

      const result = await analyzeCode({
        code: selectedCode,
        language: detectLikelyLanguage(selectedCode),
      });

      setAnalysis(result);
      setStatus({ type: 'success', message: 'Analysis complete.' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Analyze failed. Check API URL/token in settings.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSaveSnippet() {
    if (!authState.isAuthenticated) {
      setPendingSaveAfterAuth(true);
      setShowAuthPanel(true);
      setStatus({ type: 'empty', message: 'Login or sign up to save this snippet.' });
      return;
    }

    await handleSaveFlow();
  }

  async function handleSaveSettings() {
    try {
      setIsSavingSettings(true);
      await saveSettings({ apiBaseUrl });

      const authData = await getAuthStatus();
      setAuthState(normalizeAuthState(authData));

      setStatus({ type: 'success', message: 'Settings saved.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to save settings.' });
    } finally {
      setIsSavingSettings(false);
    }
  }

  function handleAuthFieldChange(field, value) {
    setAuthForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmittingAuth(true);

      const payload = {
        email: authForm.email.trim(),
        password: authForm.password,
      };

      const authData =
        authMode === 'login'
          ? await login(payload)
          : await signup({
              ...payload,
              name: authForm.name.trim(),
              college: authForm.college.trim(),
            });

      setAuthState(normalizeAuthState(authData));
      setAuthForm((previous) => ({ ...previous, password: '' }));
      setShowAuthPanel(false);
      setStatus({ type: 'success', message: 'Authentication successful.' });

      if (pendingSaveAfterAuth) {
        setPendingSaveAfterAuth(false);
        await handleSaveFlow();
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Authentication failed.' });
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      setAuthState({ isAuthenticated: false, user: null });
      setStatus({ type: 'success', message: 'Logged out.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Logout failed.' });
    }
  }

  return (
    <main className="popup-root">
      <header>
        <h1>PrepSnippet</h1>
        <p>Analyze selected code instantly</p>
      </header>

      <section className="auth-state-card">
        {authState.isAuthenticated ? (
          <>
            <p>
              Signed in as <strong>{authState.user?.name || authState.user?.email || 'User'}</strong>
            </p>
            <button type="button" className="secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <p>Not logged in. You can analyze freely, but saving requires auth.</p>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setAuthMode('login');
                setShowAuthPanel(true);
              }}
            >
              Login to Save
            </button>
          </>
        )}
      </section>

      <SettingsPanel
        apiBaseUrl={apiBaseUrl}
        onApiBaseUrlChange={setApiBaseUrl}
        onSave={handleSaveSettings}
        isSaving={isSavingSettings}
      />

      <section className="preview-card">
        <h2>Selected Code</h2>
        <pre>{codePreview || 'No code selected yet.'}</pre>
      </section>

      <section className="title-card">
        <label htmlFor="snippet-title">Title for saved snippet</label>
        <input
          id="snippet-title"
          type="text"
          value={snippetTitle}
          onChange={(event) => setSnippetTitle(event.target.value)}
          placeholder="Two Sum - Hash Map approach"
          maxLength={120}
        />
      </section>

      <div className="action-row">
        <button type="button" onClick={handleAnalyze} disabled={isAnalyzing || !selectedCode.trim()}>
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>

        <button
          type="button"
          onClick={handleSaveSnippet}
          disabled={isSavingSnippet || !analysis}
          className="secondary"
        >
          {isSavingSnippet ? 'Saving...' : 'Save'}
        </button>
      </div>

      {status.message ? (
        <p className={`status status-${status.type}`} role="status">
          {status.message}
        </p>
      ) : null}

      {showAuthPanel ? (
        <AuthPanel
          mode={authMode}
          form={authForm}
          isSubmitting={isSubmittingAuth}
          onModeChange={setAuthMode}
          onChange={handleAuthFieldChange}
          onSubmit={handleAuthSubmit}
          onCancel={() => {
            setShowAuthPanel(false);
            setPendingSaveAfterAuth(false);
          }}
        />
      ) : null}

      <ResultView analysis={analysis} />
    </main>
  );
}
