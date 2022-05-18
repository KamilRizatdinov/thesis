import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/assemblyscript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(5000, 2000, 0.01, 10);
  },
});

console.log(results.join('\n'));
