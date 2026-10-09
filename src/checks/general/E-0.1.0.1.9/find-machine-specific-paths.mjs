const pathPatterns = [
  /[a-z]:[\\/]+(?:users|home|srv|var[\\/]lib)[\\/]+[^\s"'`,;\])]+/iu,
  /\/(?:home|users|srv)\/[^\s"'`,;\])]+/iu,
  /(?:^|[^a-z0-9])(?:C:|D:)[\\/]+(?:eliware|Users[\\/]\w+[\\/]src)(?:[\\/]|$)/iu,
];

export async function findMachineSpecificPaths(files, readBytes) {
  const findings = [];
  for (const file of files) {
    const content = decodeText(await readBytes(file));
    if (content !== null && pathPatterns.some((pattern) => pattern.test(content)))
      findings.push(file);
  }
  return findings;
}

function decodeText(bytes) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  for (const character of text) {
    const code = character.codePointAt(0);
    if ((code < 32 && ![9, 10, 13].includes(code)) || (code >= 127 && code <= 159)) return null;
  }
  return text;
}
