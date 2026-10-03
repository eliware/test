export function selectJestCli(resolveConsumer, resolveShared) {
  const consumerCli = resolveConsumer();
  if (consumerCli) return consumerCli;
  const sharedCli = resolveShared();
  if (sharedCli) return sharedCli;
  throw new Error("No Jest executable could be resolved.");
}
