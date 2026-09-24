const wrapperOwnedOptions = new Set([
  "--write",
  "-w",
  "--check",
  "-c",
  "--list-different",
  "-l",
  "--config",
  "--no-config",
  "--config-precedence",
  "--no-editorconfig",
  "--ignore-path",
  "--no-ignore",
  "--with-node-modules",
  "--range-start",
  "--range-end",
  "--require-pragma",
  "--insert-pragma",
  "--parser",
  "--stdin-filepath",
  "--plugin",
  "--plugin-search-dir",
  "--plugin-search-path",
  "--print-width",
  "--tab-width",
  "--use-tabs",
  "--no-use-tabs",
  "--semi",
  "--no-semi",
  "--single-quote",
  "--no-single-quote",
  "--quote-props",
  "--jsx-single-quote",
  "--trailing-comma",
  "--bracket-spacing",
  "--no-bracket-spacing",
  "--bracket-same-line",
  "--no-bracket-same-line",
  "--arrow-parens",
  "--prose-wrap",
  "--end-of-line",
  "--embedded-language-formatting",
  "--html-whitespace-sensitivity",
  "--vue-indent-script-and-style",
  "--single-attribute-per-line",
  "--object-wrap",
  "--no-object-wrap",
  "--experimental-operator-position",
  "--experimental-ternaries",
  "--help",
  "-h",
  "--version",
  "-v",
  "--find-config-path",
  "--file-info",
  "--support-info",
]);

export function validatePrettierArguments(args) {
  if (!Array.isArray(args)) return "Prettier arguments must be an array of strings.";
  for (const argument of args) {
    if (typeof argument !== "string") return "Prettier arguments must be an array of strings.";
    const option = argument.split("=", 1)[0];
    if (wrapperOwnedOptions.has(option) || option.startsWith("--experimental-")) {
      return `Prettier argument ${argument} conflicts with wrapper-owned formatting mode, configuration, or file coverage.`;
    }
  }
  return null;
}
