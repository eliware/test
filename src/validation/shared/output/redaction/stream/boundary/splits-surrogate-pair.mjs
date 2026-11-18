function splitsSurrogatePair(text, followingCodeUnit) {
  const lastCodeUnit = text.charCodeAt(text.length - 1);
  return (
    lastCodeUnit >= 0xd800 &&
    lastCodeUnit <= 0xdbff &&
    followingCodeUnit >= 0xdc00 &&
    followingCodeUnit <= 0xdfff
  );
}
export default splitsSurrogatePair;
