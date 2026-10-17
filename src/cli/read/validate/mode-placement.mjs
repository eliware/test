export function validateModePlacement(
  wrapperArgs,
  delegatedArgs,
  modes,
  modeFlags,
  diagnosticFlagIndexes,
) {
  if (modes.length > 1) throw new Error("Validation mode flags are mutually exclusive.");
  if (diagnosticFlagIndexes.length > 1 || delegatedArgs.includes("--debug-timing"))
    throw new Error("--debug-timing may be supplied once as a wrapper argument.");
  if (modes.length === 0) return;
  const modeIndex = wrapperArgs.indexOf(modes[0]);
  if (diagnosticFlagIndexes.some((index) => index > modeIndex))
    throw new Error("--debug-timing must come before a tool mode.");
  const unsupportedWrapperArgs = wrapperArgs
    .slice(0, modeIndex)
    .filter((argument) => argument !== "--debug-timing");
  if (unsupportedWrapperArgs.length > 0)
    throw new Error(`Tool mode arguments must follow ${modes[0]} or the -- separator.`);
}
