import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {runBackProp} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    runBackProp(2850000);
  },
  numIterations: 1,
  numWarmup: 0,
});

console.log([mean(results), peak(results), min(results)].join());
