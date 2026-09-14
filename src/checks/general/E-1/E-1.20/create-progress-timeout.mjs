export function createProgressTimeout({ timeoutMs, onTimeout }) {
  let timer;
  let timedOut = false;
  const reset = () => {
    if (!timeoutMs) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
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
