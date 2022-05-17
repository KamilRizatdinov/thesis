import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';
import {main} from '../build/javascript/index.js';

const results = await benchmarkWrapper({
  async run() {
    main(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris porta urna mi, a scelerisque turpis rutrum quis. Mauris cursus, ligula non luctus fermentum, lacus augue suscipit arcu, eget iaculis sem ante quis felis. Nunc non faucibus felis. In tincidunt magna tortor, a dictum tellus fermentum vitae. In dictum viverra elit, et vulputate dui condimentum sed. Quisque convallis vehicula aliquet. Phasellus eu risus rhoncus, ultricies ex non, eleifend felis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vitae est non massa suscipit porttitor. Aliquam interdum augue finibus volutpat facilisis. Etiam nec sagittis erat, eu ornare lectus. Aliquam vitae congue lacus, sed luctus augue. Sed non ipsum id augue eleifend gravida in in dui. Pellentesque erat lectus, fringilla et finibus nec, vestibulum egestas elit. Duis tincidunt dui sed sem pretium, eu blandit libero congue. Nulla commodo massa et est imperdiet efficitur. ',
    );
  },
});

console.log([mean(results), peak(results), min(results)].join());
