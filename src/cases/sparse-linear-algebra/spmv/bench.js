import {benchmarkWrapper} from '../../../../../utils/benchmarkWrapper';
import {main} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    main(5000, 2000, 0.01, 30);
  },
  numIterations: 50,
});

console.log(results.join('\n'));
