import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {runPageRank} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    runPageRank(5000, 10, 0.00000001, 100000);
  },
});

console.log([mean(results), peak(results), min(results)].join());
