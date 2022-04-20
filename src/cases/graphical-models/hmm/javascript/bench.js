import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {bwa_hmm} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    bwa_hmm('n', 500);
  },
});

console.log([mean(results), peak(results), min(results)].join());
