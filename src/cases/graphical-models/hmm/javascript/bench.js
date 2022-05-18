import {benchmarkWrapper} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/javascript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main('n', 100);
  },
});

console.log(results.join('\n'));
