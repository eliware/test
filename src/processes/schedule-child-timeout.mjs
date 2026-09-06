import { terminateChildProcess } from './terminate-child-process.mjs';

/** Schedule bounded child-process timeout escalation and return its cancellation. */
export function scheduleChildTimeout(child, { timeoutMs, getErrorMessage = () => '', finish, terminate = terminateChildProcess }) {
  let forceKill;
  let finalKill;
  const timeout = setTimeout(() => {
    terminate(child, 'SIGTERM');
    forceKill = setTimeout(() => {
      terminate(child, 'SIGKILL');
      finalKill = setTimeout(() => {
        terminate(child, 'SIGKILL');
        finish(`Child process timed out after ${timeoutMs} ms\n${getErrorMessage()}Child process remained alive after SIGKILL\n`);
      }, 1000);
      finalKill.unref?.();
    }, 1000);
    forceKill.unref?.();
  }, timeoutMs);
  return () => {
    clearTimeout(timeout);
    clearTimeout(forceKill);
    clearTimeout(finalKill);
  };
}
