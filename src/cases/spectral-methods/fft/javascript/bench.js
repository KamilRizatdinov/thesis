import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {runFFT} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    runFFT(10);
  },
});

console.log([mean(results), peak(results), min(results)].join());
