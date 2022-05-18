import {benchmarkWrapper} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/javascript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(5000, 2000, 0.01, 30);
  },
});

console.log(results.join('\n'));
