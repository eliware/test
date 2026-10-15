export function createProgressTimeout({ timeoutMs, onTimeout }) {
  let timer;
  let timedOut = false;
  const reset = () => {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timedOut) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (timedOut) return;
      timedOut = true;
      onTimeout();
    }, timeoutMs);
  };
  const stop = () => clearTimeout(timer);
  return {
    reset,
    stop,
    wasTriggered: () => timedOut,
  };
}
