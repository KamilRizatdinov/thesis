import {benchmarkWrapper} from '../../../../../utils/benchmarkWrapper';
import {main} from './index.js';

const results = await benchmarkWrapper({
  async run() {
    main(8);
  },
  numIterations: 50,
});

console.log(results.join('\n'));