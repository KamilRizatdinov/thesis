import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {runLavaMD} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    console.log('iteration');
    runLavaMD(6);
  },
  numIterations: 1,
  numWarmup: 1,
});

console.log([mean(results), peak(results), min(results)].join());
