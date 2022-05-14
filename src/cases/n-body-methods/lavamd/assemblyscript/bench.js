import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/assemblyscript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(6);
  },
  numIterations: 1,
  numWarmup: 0,
});

console.log([mean(results), peak(results), min(results)].join());
