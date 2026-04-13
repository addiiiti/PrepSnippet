function getTextSelection() {
  const selection = window.getSelection();
  const selected = selection ? selection.toString().trim() : '';
  if (selected) {
    return selected;
  }

  const active = document.activeElement;
  if (
    active &&
    (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type === 'text'))
  ) {
    const start = active.selectionStart;
    const end = active.selectionEnd;
    if (typeof start === 'number' && typeof end === 'number' && end > start) {
      return active.value.slice(start, end).trim();
    }
  }

  return '';
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'PREPSNIPPET_GET_SELECTION') {
    return;
  }

  try {
    const selectedCode = getTextSelection();
    sendResponse({ ok: true, selectedCode });
  } catch (error) {
    sendResponse({ ok: false, error: error?.message || 'Failed to read selection' });
  }
});
