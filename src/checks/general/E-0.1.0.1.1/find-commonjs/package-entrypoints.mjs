export function hasCommonJsPackageEntrypoint(packageJson) {
  return /(?:^|["'])[^"']+\.(?:cjs|cts)(?:["']|$)/iu.test(JSON.stringify(packageJson ?? {}));
}
