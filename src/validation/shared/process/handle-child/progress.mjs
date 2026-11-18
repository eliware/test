export default function handleChildProgress(text, options) {
  if (!options.progressPattern?.test(text)) return false;
  if (!options.resetOnAnyOutput) options.resetProgressTimer();
  options.onProgress?.(text);
  return true;
}
