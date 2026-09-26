const unsupportedOperations =
  /(?:node:)?(?:fs|fs\/promises)\.(?:rm|rmdir|unlink|rename|writeFile|chmod)|\b(?:fetch|https?\.request|net\.connect|process\.exit)\s*\(/iu;

export function validateKnitSourceOperations(source) {
  return unsupportedOperations.test(source)
    ? ".knit/validate.mjs contains an unsupported filesystem, network, process, or subprocess operation."
    : null;
}
