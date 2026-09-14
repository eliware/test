export function handleChildProgress(text, options) {
  if (!options.progressPattern?.test(text)) return false;
  options.resetProgressTimer();
  options.onProgress?.(text);
  return true;
}
