export function isEnvironmentFile(name) {
  const normalized = name.toLowerCase();
  return (
    (/^\.env(?:$|\.)/u.test(normalized) || normalized === ".envrc") && normalized !== ".env.example"
  );
}
