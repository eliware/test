export function createNumericMinHeap() {
  const values = [];

  function insert(value) {
    values.push(value);
    let index = values.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (values[parent] <= value) break;
      values[index] = values[parent];
      index = parent;
    }
    values[index] = value;
  }

  function removeRoot() {
    const root = values[0];
    const last = values.pop();
    if (values.length > 0) {
      let index = 0;
      while (index * 2 + 1 < values.length) {
        let child = index * 2 + 1;
        if (child + 1 < values.length && values[child + 1] < values[child]) child += 1;
        if (last <= values[child]) break;
        values[index] = values[child];
        index = child;
      }
      values[index] = last;
    }
    return root;
  }

  return Object.freeze({
    insert,
    removeRoot,
    get size() {
      return values.length;
    },
    peek: () => values[0],
  });
}
