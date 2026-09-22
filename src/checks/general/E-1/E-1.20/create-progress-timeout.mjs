export function createProgressTimeout({ timeoutMs, onTimeout }) {
  let timer;
  let timedOut = false;
  const reset = () => {
    if (!timeoutMs || timedOut) return;
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
