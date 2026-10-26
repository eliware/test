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
    return (
      protectedNames.has(name) || isEnvironmentFile(name) || /\.(?:pem|key|p12|pfx)$/u.test(name)
    );
  });
}
import { isEnvironmentFile } from "./environment-file.mjs";
