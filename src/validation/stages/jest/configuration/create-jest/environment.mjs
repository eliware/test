import createJestNodeOptions from "./node-options.mjs";
export default function createJestEnvironment(invokingEnvironment = process.env) {
  return {
    ...invokingEnvironment,
    NODE_OPTIONS: createJestNodeOptions(invokingEnvironment.NODE_OPTIONS),
  };
}
