import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/javascript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(5000, 2000, 0.01, 10);
  },
});

console.log([mean(results), peak(results), min(results)].join());
