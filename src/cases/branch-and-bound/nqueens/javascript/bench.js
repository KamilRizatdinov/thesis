import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {runNQueens} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    runNQueens(32);
  },
});

console.log([mean(results), peak(results), min(results)].join());
