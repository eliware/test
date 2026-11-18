export default function isValidBinTarget(value) {
  return typeof value === "string" && Boolean(value.trim());
}
