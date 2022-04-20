/**
 * CRC32 implementation from https://stackoverflow.com/a/18639999/17465982
 */

var makeCRCTable = function (): Array<usize> {
  var c: i32;
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

export function crc32(str: string): void {
  var crcTable = makeCRCTable();
  var crc = 0 ^ -1;

  for (var i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ (<i32>crcTable[(crc ^ str.charCodeAt(i)) & 0xff]);
  }

  console.log(((crc ^ -1) >>> 0).toString());
}
