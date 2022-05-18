import {benchmarkWrapper} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/assemblyscript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(10);
  },
  numIterations: 10,
});

console.log(results.join('\n'));
