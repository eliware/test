const protectedNames = new Set([
  "id_rsa",
  "secret",
  "secrets",
  "credential",
  "credentials",
  "token",
  "tokens",
]);

export function isProtectedComponent(component) {
  const name = component.toLowerCase();
  return protectedNames.has(name) || /\.(?:pem|key|p12|pfx)$/u.test(name);
}
