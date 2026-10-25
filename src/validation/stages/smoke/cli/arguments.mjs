export function validateSmokeCliArguments(args) {
  if (!Array.isArray(args) || args.length !== 2 || args[0] !== "--target" || !args[1])
    return { error: "Usage: npm run smoke -- --target <existing-consumer-path>" };
  return { target: args[1] };
}
