export default function SettingsPanel({
  apiBaseUrl,
  onApiBaseUrlChange,
  onSave,
  isSaving,
}) {
  return (
    <details className="settings-panel">
      <summary>Settings</summary>
      <div className="settings-body">
        <label htmlFor="api-base-url">Backend Base URL</label>
        <input
          id="api-base-url"
          type="url"
          placeholder="http://localhost:5000"
          value={apiBaseUrl}
          onChange={(event) => onApiBaseUrlChange(event.target.value)}
        />

        <button type="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </details>
  );
}
