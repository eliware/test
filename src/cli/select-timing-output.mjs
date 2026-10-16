export function selectTimingOutput(args, write, stdout = process.stdout) {
  if (!args.includes("--debug-timing")) return undefined;
  return write === console.log ? stdout.write.bind(stdout) : write;
}
