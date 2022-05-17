var makeCRCTable = function (): StaticArray<i32> {
  var c: i32;
  var n: i32;
  var crcTable = new StaticArray<i32>(256);

  for (n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    unchecked((crcTable[n] = c));
  }
  return crcTable;
};

export function main(str: string): void {
  var crcTable = makeCRCTable();
  var crc = 0 ^ -1;

  for (var i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ unchecked(crcTable[(crc ^ str.charCodeAt(i)) & 0xff]);
  }

  // console.log(crc.toString());
}
