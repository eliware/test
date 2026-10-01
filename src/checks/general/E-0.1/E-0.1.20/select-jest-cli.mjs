export function selectJestCli(resolveConsumer, resolveShared) {
  let consumerError;
  try {
    const consumerCli = resolveConsumer();
    if (consumerCli) return consumerCli;
  } catch (error) {
    consumerError = error;
  }
  const sharedCli = resolveShared();
  if (sharedCli) return sharedCli;
  if (consumerError) throw consumerError;
  throw new Error("No Jest executable could be resolved.");
}
