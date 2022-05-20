import {init, getFunctionsStatuses} from '../../../../../utils/trace';

var makeCRCTable = function () {
  var c;
  var crcTable = [];
  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
};

export function main(str) {
  var crcTable = makeCRCTable();
  var crc = 0 ^ -1;

  for (var i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
  }

  // console.log(crc);
}

init();
for (let i = 0; i < 50; i++) {
  console.log(getFunctionsStatuses([makeCRCTable, main]).join('\n'));

  main(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris porta urna mi, a scelerisque turpis rutrum quis. Mauris cursus, ligula non luctus fermentum, lacus augue suscipit arcu, eget iaculis sem ante quis felis. Nunc non faucibus felis. In tincidunt magna tortor, a dictum tellus fermentum vitae. In dictum viverra elit, et vulputate dui condimentum sed. Quisque convallis vehicula aliquet. Phasellus eu risus rhoncus, ultricies ex non, eleifend felis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vitae est non massa suscipit porttitor. Aliquam interdum augue finibus volutpat facilisis. Etiam nec sagittis erat, eu ornare lectus. Aliquam vitae congue lacus, sed luctus augue. Sed non ipsum id augue eleifend gravida in in dui. Pellentesque erat lectus, fringilla et finibus nec, vestibulum egestas elit. Duis tincidunt dui sed sem pretium, eu blandit libero congue. Nulla commodo massa et est imperdiet efficitur. ',
  );
}
