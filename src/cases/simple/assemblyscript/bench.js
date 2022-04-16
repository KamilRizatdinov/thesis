import { benchmarkWrapper, mean, peak, min } from "../../../utils/benchmarkWrapper";
import { add } from "./index.js";

const results = await benchmarkWrapper({
  async run() {
    add(1,2);
  },
});

console.log([mean(results), peak(results), min(results)].join());
