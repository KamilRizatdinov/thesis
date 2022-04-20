import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {runLavaMD} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    runLavaMD(6);
  },
});

console.log([mean(results), peak(results), min(results)].join());
