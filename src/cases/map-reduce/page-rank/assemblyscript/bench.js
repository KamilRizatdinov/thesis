import {benchmarkWrapper} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/assemblyscript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(1000, 10, 0.00000001, 100000);
  },
});

console.log(results.join('\n'));
