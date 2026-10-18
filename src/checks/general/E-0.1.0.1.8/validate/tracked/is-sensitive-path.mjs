const protectedNames = new Set([
  "id_rsa",
  "secret",
  "secrets",
  "credential",
  "credentials",
  "token",
  "tokens",
]);

export function isSensitivePath(path) {
  const parts = path.replaceAll("\\", "/").split("/");
  return parts.some((part) => {
    const name = part.toLowerCase();
    const environmentFile = /^\.env(?:$|\.)/u.test(name) || name === ".envrc";
    const exampleFile = name === ".env.example";
    return (
      protectedNames.has(name) ||
      (environmentFile && !exampleFile) ||
      /\.(?:pem|key|p12|pfx)$/u.test(name)
    );
  });
}
