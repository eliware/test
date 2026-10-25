export function createProseParagraphCollector() {
  const paragraphs = [];
  let current;
  return {
    append(text, line) {
      const value = text.trim();
      if (!value) return;
      if (!current) current = { text: value, line, kind: "paragraph" };
      else current.text += ` ${value}`;
    },
    flush() {
      if (current) paragraphs.push(current);
      current = undefined;
    },
    finish() {
      this.flush();
      return paragraphs;
    },
  };
}
