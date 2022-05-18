import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {main} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    main(8);
  },
});

console.log(results.join('\n'));
