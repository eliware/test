import collectBindingNames from "./binding-names.mjs";
import addShadowedJestName from "./shadowed-jest-names/local-bindings.mjs";
import collectLocalShadowedJestNames from "./shadowed-jest-names/local-bindings/collect-local-shadowed-jest-names.mjs";
export default function collectShadowedJestNames(fn, names, callbackNames) {
  const shadowed = {
    tests: new Set(),
    callbacks: new Set(),
    describes: new Set(),
  };
  for (const parameter of fn.params ?? [])
    for (const name of collectBindingNames(parameter))
      addShadowedJestName(name, shadowed, names, callbackNames);
  collectLocalShadowedJestNames(fn.body?.body ?? fn.body, names, callbackNames, shadowed);
  return shadowed;
}
