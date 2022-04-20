import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {runSRAD} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    runSRAD(500, 1);
  },
  numIterations: 1,
  numWarmup: 0,
});

console.log([mean(results), peak(results), min(results)].join());
