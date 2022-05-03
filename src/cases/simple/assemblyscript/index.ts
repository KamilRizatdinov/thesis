export function add(a: i32, b: i32): Map<i32, Map<i32, Array<i32>>> {
  var mat = new Map<i32, Map<i32, Array<i32>>>();
  var tmp = new Map<i32, Array<i32>>();
  tmp.set(1, new Array<i32>());
  mat.set(0, tmp);

  var tmp2 = mat.get(0);
  tmp2.get(1).push(228);

  console.log(mat.get(0).get(1).at(0).toString());

  return mat;
}
