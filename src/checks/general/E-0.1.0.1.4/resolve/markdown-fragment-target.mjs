import hasMarkdownFragment from "../resolve-markdown-fragment.mjs";
export default async function hasMarkdownFragmentTarget(read, target, fragment) {
  return hasMarkdownFragment(await read(target, "utf8"), fragment);
}
