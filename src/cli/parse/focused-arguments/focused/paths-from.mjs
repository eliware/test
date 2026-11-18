import parseFocusedArguments from "../../focused-arguments.mjs";
function focusedPathsFrom(args = []) {
  return parseFocusedArguments(args).positional.filter((argument) =>
    /^tests(?:[\\/]|$)/iu.test(argument),
  );
}
export default focusedPathsFrom;
