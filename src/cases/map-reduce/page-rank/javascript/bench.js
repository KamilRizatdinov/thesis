import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/javascript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(5000, 10, 0.00000001, 100000);
  },
  numIterations: 1,
  numWarmup: 0,
});

console.log([mean(results), peak(results), min(results)].join());
