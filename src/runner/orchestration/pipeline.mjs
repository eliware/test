export async function runValidationPipeline(context, stages) {
  for (const stage of stages) {
    const code = await stage(context);
    if (code !== 0) return code;
  }
  return 0;
}
