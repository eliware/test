export default function truncateOutputTextToBytes(text, byteLimit) {
  const encoded = Buffer.from(text);
  if (encoded.length <= byteLimit)
    return {
      text,
      byteLength: encoded.length,
    };
  let end = Math.max(0, Math.min(byteLimit, encoded.length));
  if (end < encoded.length && (encoded[end] & 0xc0) === 0x80) {
    while (end > 0 && (encoded[end] & 0xc0) === 0x80) end -= 1;
  }
  const bounded = encoded.subarray(0, end);
  return {
    text: bounded.toString("utf8"),
    byteLength: end,
  };
}
