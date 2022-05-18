import {benchmarkWrapper} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/assemblyscript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main('n', 500);
  },
});

console.log(results.join('\n'));
