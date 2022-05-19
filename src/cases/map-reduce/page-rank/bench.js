import {benchmarkWrapper} from '../../../../../utils/benchmarkWrapper';
import {main} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    main(1000, 10, 0.00000001, 100000);
  },
  numIterations: 50,
});

console.log(results.join('\n'));
