const tokenNames = ["NPM_TOKEN", "NODE_AUTH_TOKEN"];

export function hasNpmPublicationTokenSetting(command) {
  return tokenNames.some((token) =>
    new RegExp(
      `(?:^|[\\s;,.])(?:export\\s+|set\\s+)?${token}\\s*=|\\$\\{${token}\\b[^}]*\\}|\\$${token}\\b|\\$\\{\\{\\s*secrets\\.${token}\\s*\\}\\}`,
      "iu",
    ).test(command),
  );
}
