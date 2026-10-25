export function formatSmokeFinalizationFailure(outcome, error, tempRoot) {
  const detail = error instanceof Error ? error.message : String(error);
  const recovery = tempRoot ? ` Recovery data may remain at ${tempRoot}.` : "";
  return `${outcome ?? "Tarball consumer smoke failed."} Smoke finalization failed: ${detail}.${recovery}`;
}
