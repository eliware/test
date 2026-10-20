export function smokeCommandFailure(result, label) {
  const detail = [result?.stdout, result?.stderr].filter(Boolean).join("\n").trim();
  return label + (detail ? ": " + detail : ".");
}
