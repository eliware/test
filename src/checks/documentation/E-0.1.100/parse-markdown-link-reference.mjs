export function parseMarkdownLinkReference(reference) {
  const fragmentIndex = reference.indexOf("#");
  const beforeFragment = fragmentIndex < 0 ? reference : reference.slice(0, fragmentIndex);
  const queryIndex = beforeFragment.indexOf("?");
  return {
    path: (queryIndex < 0 ? beforeFragment : beforeFragment.slice(0, queryIndex)).trim(),
    fragment: fragmentIndex < 0 ? undefined : reference.slice(fragmentIndex + 1),
  };
}
