function createUntrustedTargetError() {
  return new Error(
    "Smoke target directory changed during validation. Refusing access to an untrusted target.",
  );
}

export function createSmokeTargetIdentityGuard(targetRoot, identity, inspect) {
  return async () => {
    let current;
    try {
      current = await inspect(targetRoot);
    } catch {
      throw createUntrustedTargetError();
    }
    if (
      !current.isDirectory() ||
      current.dev !== identity.dev ||
      current.ino !== identity.ino ||
      current.birthtimeMs !== identity.birthtimeMs
    )
      throw createUntrustedTargetError();
  };
}
