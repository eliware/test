import collectOutputText from "../text.mjs";
export default function addOutputProseBlocks(value, line, blocks) {
  for (const text of collectOutputText(value)) {
    if (text.trim())
      blocks.push({
        text,
        line,
        kind: "prose",
      });
  }
}
