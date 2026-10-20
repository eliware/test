export function isMeaningfulReleaseNoteLine(line) {
  return (
    !/^\s{0,3}#{1,6}(?:\s|$)/u.test(line) &&
    !/^\s*(?:tbd|todo|n\/?a|none|no changes?)\s*\.?\s*$/iu.test(line) &&
    /\p{L}/u.test(line)
  );
}
