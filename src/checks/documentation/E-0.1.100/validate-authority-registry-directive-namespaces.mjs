const namespacePattern = /^[EA]-\d+(?:\.\d+)*$/;

export function validateAuthorityRegistryDirectiveNamespaces(entry) {
  return !Array.isArray(entry.directiveNamespaces) ||
    entry.directiveNamespaces.some((namespace) => !namespacePattern.test(namespace))
    ? `${entry.repository} must declare valid directiveNamespaces.`
    : null;
}
