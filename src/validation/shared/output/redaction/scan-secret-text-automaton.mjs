export function scanSecretTextAutomaton(nodes, text, maxScanWork, initialState = 0, offset = 0) {
  const matchEnds = Array.from({ length: text.length + 1 }, () => 0);
  const matches = [];
  let state = initialState;
  let work = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    while (state !== 0 && !nodes[state].transitions.has(character)) {
      state = nodes[state].failure;
      work += 1;
      if (work > maxScanWork) return null;
    }
    state = nodes[state].transitions.get(character) ?? 0;
    work += 1;
    if (work > maxScanWork) return null;
    for (
      let output = nodes[state].lengths.length > 0 ? state : nodes[state].outputLink;
      output !== 0;
      output = nodes[output].outputLink
    ) {
      for (const length of nodes[output].lengths) {
        work += 1;
        if (work > maxScanWork) return null;
        const start = index - length + 1;
        matchEnds[start] = Math.max(matchEnds[start], index + 1);
        matches.push({ start: offset + start, end: offset + index + 1 });
      }
    }
  }
  return { matchEnds, matches, state, work };
}
