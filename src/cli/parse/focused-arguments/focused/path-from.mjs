import parseFocusedArguments from "../../focused-arguments.mjs";
function focusedPathFrom(args = []) {
  return parseFocusedArguments(args).positional.find((argument) =>
    /^tests(?:[\\/]|$)/iu.test(argument),
  );
}
export default focusedPathFrom;
