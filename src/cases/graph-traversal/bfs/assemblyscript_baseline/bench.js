import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/assemblyscript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(100000);
  },
});

console.log([mean(results), peak(results), min(results)].join());
