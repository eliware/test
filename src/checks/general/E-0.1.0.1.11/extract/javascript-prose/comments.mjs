export default function extractJavaScriptComments(comments = []) {
  return comments.map((comment) => ({
    text: comment.value,
    line: comment.loc.start.line,
    kind: "prose",
  }));
}
