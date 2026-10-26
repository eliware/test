export function createSecretSearchWorkBudget(limit) {
  let consumed = 0;
  return (work) => {
    consumed += work;
    return consumed <= limit;
  };
}
