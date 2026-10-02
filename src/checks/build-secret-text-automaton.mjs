export function buildSecretTextAutomaton(secrets, maxBuildWork) {
  let buildWork = 0;
  const nodes = [{ transitions: new Map(), failure: 0, outputLink: 0, lengths: [] }];
  for (const secret of secrets) {
    let state = 0;
    for (let index = 0; index < secret.length; index += 1) {
      buildWork += 1;
      if (buildWork > maxBuildWork) return null;
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

  const queue = [...nodes[0].transitions.values()];
  for (const state of queue) nodes[state].failure = 0;
  for (let index = 0; index < queue.length; index += 1) {
    const state = queue[index];
    for (const [character, next] of nodes[state].transitions) {
      let failure = nodes[state].failure;
      while (failure !== 0 && !nodes[failure].transitions.has(character)) {
        buildWork += 1;
        if (buildWork > maxBuildWork) return null;
        failure = nodes[failure].failure;
      }
      buildWork += 1;
      if (buildWork > maxBuildWork) return null;
      nodes[next].failure = nodes[failure].transitions.get(character) ?? 0;
      const fallback = nodes[next].failure;
      nodes[next].outputLink =
        nodes[fallback].lengths.length > 0 ? fallback : nodes[fallback].outputLink;
      queue.push(next);
    }
  }
  return nodes;
}
