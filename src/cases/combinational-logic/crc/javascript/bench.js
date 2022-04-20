import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {runCRC} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    runCRC(65536, 128, 150);
  },
});

console.log([mean(results), peak(results), min(results)].join());
