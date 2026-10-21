export async function captureSmokeFile(path, info, fs) {
  return { path, type: "file", data: await fs.readFile(path), mode: info.mode };
}
