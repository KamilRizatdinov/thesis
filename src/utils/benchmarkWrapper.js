const numIterationsDefault = 50;

export async function benchmarkWrapper({
  run = () => {},
  numIterations = numIterationsDefault,
} = {}) {
  const results = [];
  for (let i = 0; i < numIterations; i++) {
    const start = Date.now();
    await run();
    results.push(Date.now() - start);
  }
  return results;
}
