import {benchmarkWrapper} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/assemblyscript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(500, 1);
  },
  numIterations: 20,
});

console.log(results.join('\n'));
