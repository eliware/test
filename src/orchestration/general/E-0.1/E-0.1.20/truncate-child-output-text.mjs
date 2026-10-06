export function truncateChildOutputText(text, limit) {
  let end = Math.min(limit, text.length);
  const beforeBoundary = text.charCodeAt(end - 1);
  const afterBoundary = text.charCodeAt(end);
  if (
    end > 0 &&
    end < text.length &&
    beforeBoundary >= 0xd800 &&
    beforeBoundary <= 0xdbff &&
    afterBoundary >= 0xdc00 &&
    afterBoundary <= 0xdfff
  )
    end -= 1;
  return text.slice(0, end);
}
