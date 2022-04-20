import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {ludRun} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    ludRun(350);
  },
});

console.log([mean(results), peak(results), min(results)].join());
