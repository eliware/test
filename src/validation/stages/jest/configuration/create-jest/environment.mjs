import createJestNodeOptions from "./node-options.mjs";
export default function createJestEnvironment(invokingEnvironment = process.env, args = []) {
  return {
    ...invokingEnvironment,
    NODE_OPTIONS: createJestNodeOptions(invokingEnvironment.NODE_OPTIONS, {
      detectOpenHandles: args.includes("--detectOpenHandles"),
    }),
  };
}
