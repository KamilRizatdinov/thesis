import {benchmarkWrapper} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/javascript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(500, 1);
  },
  numIterations: 10,
  numWarmup: 5,
});

console.log(results.join('\n'));
