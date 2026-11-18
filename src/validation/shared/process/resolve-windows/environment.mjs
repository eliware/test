export default function resolveWindowsEnvironment(environment, baseEnvironment = process.env) {
  const entries = new Map(
    Object.entries(baseEnvironment).map(([key, value]) => [key.toLowerCase(), [key, value]]),
  );
  for (const [key, value] of Object.entries(environment)) {
    entries.set(key.toLowerCase(), [key, value]);
  }
  return Object.fromEntries(entries.values());
}
