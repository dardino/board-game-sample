export function pooling (
  fn: () => Promise<boolean>,
  timeout = 60000,
  interval = 100,
) {
  const now = performance.now();
  const timedout = () => performance.now() - now >= timeout;

  return new Promise((resolve, reject) => {
    const timerId = setInterval(async () => {
      try {
        const result = await fn(); // Replace with your own request logic
        if (result) {
          clearInterval(timerId);
          resolve(result);
          return;
        } else if (timedout()) {
          clearInterval(timerId);
          reject(new Error("Timed out"));
          return;
        }
      } catch (error) {
        clearInterval(timerId);
        reject(error);
        return;
      }
    }, interval);
  });
}
