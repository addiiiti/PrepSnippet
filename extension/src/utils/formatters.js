export function detectLikelyLanguage(code) {
  if (!code) return 'plaintext';

  if (/\b(function|const|let|var|=>|console\.log)\b/.test(code)) return 'javascript';
  if (/\b(def|print\(|import\s+\w+|elif|None)\b/.test(code)) return 'python';
  if (/\b(public\s+class|System\.out\.println|new\s+\w+\()/m.test(code)) return 'java';
  if (/\b#include\s*<|std::|cout\s*<</.test(code)) return 'cpp';

  return 'plaintext';
}

export function truncateText(text, max = 1000) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}\n...` : text;
}
