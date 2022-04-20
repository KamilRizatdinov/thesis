import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {spmvRun} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    spmvRun(50000, 2000, 0.01, 100);
  },
});

console.log([mean(results), peak(results), min(results)].join());
