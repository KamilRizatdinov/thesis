import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/javascript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(10);
  },
});

console.log(results.join('\n'));
