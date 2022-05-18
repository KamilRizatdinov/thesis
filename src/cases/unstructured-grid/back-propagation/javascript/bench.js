import {benchmarkWrapper} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/javascript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(2850000);
  },
  numIterations: 10,
  numWarmup: 5,
});

console.log(results.join('\n'));
