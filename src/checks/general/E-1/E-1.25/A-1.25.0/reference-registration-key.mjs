export function referenceRegistrationKey(reference) {
  return reference.replace(/^(?:\.\.\/|\.\/)+/u, "");
}
