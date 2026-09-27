const MAX_SCAN_WORK = 1_000_000;

export function createSecretTextMatcher(secrets, { maxScanWork = MAX_SCAN_WORK } = {}) {
  let buildWork = 0;
  const exhausted = () => () => null;
  const nodes = [{ transitions: new Map(), failure: 0, outputLink: 0, lengths: [] }];
  for (const secret of secrets) {
    let state = 0;
    for (let index = 0; index < secret.length; index += 1) {
      buildWork += 1;
      if (buildWork > maxScanWork) return exhausted();
      const character = secret[index];
      let next = nodes[state].transitions.get(character);
      if (next === undefined) {
        next = nodes.length;
        nodes[state].transitions.set(character, next);
        nodes.push({ transitions: new Map(), failure: 0, outputLink: 0, lengths: [] });
      }
      state = next;
    }
    nodes[state].lengths.push(secret.length);
  }

  if (nodes.length === 1) return (text) => text.length > maxScanWork ? null : Array.from({ length: text.length + 1 }, () => 0);

  const queue = [...nodes[0].transitions.values()];
  for (const state of queue) nodes[state].failure = 0;
  for (let index = 0; index < queue.length; index += 1) {
    const state = queue[index];
    for (const [character, next] of nodes[state].transitions) {
      let failure = nodes[state].failure;
      while (failure !== 0 && !nodes[failure].transitions.has(character)) {
        buildWork += 1;
        if (buildWork > maxScanWork) return exhausted();
        failure = nodes[failure].failure;
      }
      buildWork += 1;
      if (buildWork > maxScanWork) return exhausted();
      nodes[next].failure = nodes[failure].transitions.get(character) ?? 0;
      const fallback = nodes[next].failure;
      nodes[next].outputLink = nodes[fallback].lengths.length > 0
        ? fallback
        : nodes[fallback].outputLink;
      queue.push(next);
    }
  }

  return function findSecretEnds(text) {
    const matchEnds = Array.from({ length: text.length + 1 }, () => 0);
    let state = 0;
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
      for (let output = nodes[state].lengths.length > 0 ? state : nodes[state].outputLink;
        output !== 0;
        output = nodes[output].outputLink) {
        for (const length of nodes[output].lengths) {
          work += 1;
          if (work > maxScanWork) return null;
          const start = index - length + 1;
          matchEnds[start] = Math.max(matchEnds[start], index + 1);
        }
      }
    }
    Object.defineProperty(matchEnds, "work", { value: work });
    return matchEnds;
  };
}
