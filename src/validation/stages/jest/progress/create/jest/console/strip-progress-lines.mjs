export function stripJestProgressLines(text) {
  const parts = text.split(/(\r\n|\r|\n)/u);
  const output = [];
  for (let index = 0; index < parts.length; index += 2) {
    if (parts[index].includes("[eliware-test-progress]")) continue;
    output.push(parts[index]);
    if (parts[index + 1]) output.push(parts[index + 1]);
  }
  return output.join("");
}
