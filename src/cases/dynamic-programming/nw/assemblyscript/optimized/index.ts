const UP: i32 = 1;
const LEFT: i32 = 2;
const UL: i32 = 4;

export function main(s1: string, s2: string): void {
  const G: i32 = 2;
  const P: i32 = 1;
  const M: i32 = -1;
  var mat = new Map<i32, Map<i32, i32>>();
  var direc = new Map<i32, Map<i32, Array<i32>>>();

  var i: i32;
  var j: i32;

  // initialization
  for (i = 0; i < s1.length + 1; i++) {
    var matTmp = new Map<i32, i32>();
    matTmp.set(0, 0);
    mat.set(i, matTmp);

    var tmpDirec = new Map<i32, Array<i32>>();
    tmpDirec.set(0, new Array<i32>());
    direc.set(i, tmpDirec);

    for (j = 1; j < s2.length + 1; j++) {
      var mapInner = mat.get(i);
      var direcInner = direc.get(i);
      mapInner.set(
        j,
        i == 0 ? 0 : s1.charAt(i - 1) == s2.charAt(j - 1) ? P : M,
      );
      direcInner.set(j, new Array<i32>());
    }
  }

  // calculate each value
  for (i = 0; i < s1.length + 1; i++) {
    for (j = 0; j < s2.length + 1; j++) {
      var newval: i32 = 0;

      if (i == 0 || j == 0) {
        newval = -G * (i + j);
      } else {
        var a = mat.get(i - 1).get(j) - G;
        var b = mat.get(i - 1).get(j - 1) + mat.get(i).get(j);
        var c = mat.get(i).get(j - 1) - G;

        if (a >= b && a >= c) {
          newval = a;
        }
        if (b >= a && b >= c) {
          newval = b;
        }
        if (c >= a && c >= b) {
          newval = c;
        }
      }

      if (i > 0 && j > 0) {
        if (newval == mat.get(i - 1).get(j) - G)
          unchecked(direc.get(i).get(j).push(UP));
        if (newval == mat.get(i).get(j - 1) - G)
          unchecked(direc.get(i).get(j).push(LEFT));
        if (newval == mat.get(i - 1).get(j - 1) + unchecked(mat.get(i).get(j)))
          unchecked(direc.get(i).get(j).push(UL));
      } else {
        unchecked(
          direc
            .get(i)
            .get(j)
            .push(j == 0 ? UP : LEFT),
        );
      }
      mat.get(i).set(j, newval);
    }
  }

  // get result
  var chars = new Array<Array<string>>();
  unchecked(chars.push(new Array<string>()));
  unchecked(chars.push(new Array<string>()));
  var I = s1.length;
  var J = s2.length;
  while (I > 0 || J > 0) {
    switch (unchecked(direc.get(I).get(J).at(0))) {
      case UP:
        I--;
        unchecked(chars.at(0).push(s1.charAt(I)));
        unchecked(chars.at(1).push('-'));
        break;
      case LEFT:
        J--;
        unchecked(chars.at(0).push('-'));
        unchecked(chars.at(1).push(s2.charAt(J)));
        break;
      case UL:
        I--;
        J--;
        unchecked(chars.at(0).push(s1.charAt(I)));
        unchecked(chars.at(1).push(s2.charAt(J)));
        break;
      default:
        break;
    }
  }

  const result = chars.map<string>(function (v) {
    return v.reverse().join('');
  });

  // console.log(result.join('\n\n'));
}
