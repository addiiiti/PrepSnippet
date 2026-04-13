import { useMemo } from 'react';

export default function AuthPanel({
  mode,
  form,
  isSubmitting,
  onModeChange,
  onChange,
  onSubmit,
  onCancel,
}) {
  const submitLabel = useMemo(() => {
    if (isSubmitting) return mode === 'login' ? 'Logging in...' : 'Creating account...';
    return mode === 'login' ? 'Login' : 'Sign up';
  }, [isSubmitting, mode]);

  return (
    <section className="auth-card">
      <div className="auth-card-header">
        <h3>Save requires login</h3>
        <div className="auth-toggle">
          <button
            type="button"
            className={mode === 'login' ? 'tab active' : 'tab'}
            onClick={() => onModeChange('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'tab active' : 'tab'}
            onClick={() => onModeChange('signup')}
          >
            Sign up
          </button>
        </div>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        {mode === 'signup' ? (
          <>
            <label htmlFor="auth-name">Name</label>
            <input
              id="auth-name"
              type="text"
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder="Your name"
              required
            />

            <label htmlFor="auth-college">College (optional)</label>
            <input
              id="auth-college"
              type="text"
              value={form.college}
              onChange={(event) => onChange('college', event.target.value)}
              placeholder="Your college"
            />
          </>
        ) : null}

        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          value={form.email}
          onChange={(event) => onChange('email', event.target.value)}
          placeholder="you@example.com"
          required
        />

        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          type="password"
          value={form.password}
          onChange={(event) => onChange('password', event.target.value)}
          placeholder="At least 6 characters"
          minLength={6}
          required
        />

        <div className="auth-actions">
          <button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </button>
          <button type="button" className="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
