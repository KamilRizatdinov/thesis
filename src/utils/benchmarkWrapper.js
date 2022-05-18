const numIterationsDefault = 50;

export async function benchmarkWrapper({
  before = () => {},
  run = () => {},
  after = () => {},
  numIterations = numIterationsDefault,
} = {}) {
  const results = [];

  for (let i = 0; i < numIterations; i++) {
    const context = {};
    await before.call(context);
    const start = Date.now();
    await run.call(context);
    results.push(Date.now() - start);
    await after.call(context);
  }
  return results;
}
