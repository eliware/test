export function withoutJestConfiguration(content) {
  try {
    const manifest = JSON.parse(content);
    delete manifest.jest;
    return JSON.stringify(manifest);
  } catch {
    return content;
  }
}
