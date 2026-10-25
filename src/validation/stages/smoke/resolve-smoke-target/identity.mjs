export async function inspectSmokeTargetIdentity(targetRoot, inspect) {
  let identity;
  try {
    identity = await inspect(targetRoot);
    if (!identity.isDirectory())
      return { error: "Smoke target must resolve to an existing directory." };
  } catch {
    return { error: "Smoke target must resolve to an existing directory." };
  }
  return {
    assertIdentity: async () => {
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
    },
  };
}

function createUntrustedTargetError() {
  return new Error(
    "Smoke target directory changed during validation. Refusing access to an untrusted target.",
  );
}
