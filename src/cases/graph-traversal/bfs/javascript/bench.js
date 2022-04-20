import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {BFSGraph} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    BFSGraph(100000);
  },
});

console.log([mean(results), peak(results), min(results)].join());
