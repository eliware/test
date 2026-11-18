function terminateChildProcess(child) {
  try {
    if (typeof child?.kill === "function") child.kill();
  } catch {}
}
export default terminateChildProcess;
