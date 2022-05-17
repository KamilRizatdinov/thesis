var bit_mask1: i32 = 2863311530;
var bit_mask2: i32 = 3435973836;
var bit_mask3: i32 = 4042322160;
var bit_mask4: i32 = 4278255360;
var bit_mask5: i32 = 4294901760;

// if (typeof performance === 'undefined') performance = Date;

function bit_scan(x: i32): i32 {
  var res = 0;
  res |= x & bit_mask1 ? 1 : 0;
  res |= x & bit_mask2 ? 2 : 0;
  res |= x & bit_mask3 ? 4 : 0;
  res |= x & bit_mask4 ? 8 : 0;
  res |= x & bit_mask5 ? 16 : 0;
  return res;
}

function transform(
  ns_array: Uint32Array,
  board_array: Int32Array,
  size: i32,
): void {
  var i: i32;
  for (i = 0; i < size; i++) {
    board_array[i] = bit_scan(ns_array[i]);
  }
}

function nqueen_solver1(size: i32, idx: i32): i32 {
  var masks = new Uint32Array(32);
  var left_masks = new Uint32Array(32);
  var right_masks = new Uint32Array(32);
  var ms = new Uint32Array(32);
  var ns: i32 = 0;
  var solutions: i32 = 0;
  var i = 0;

  masks[0] = 1 | (1 << idx);
  left_masks[0] = (1 << 2) | (1 << (idx + 1));
  right_masks[0] = (1 << idx) >> 1;
  ms[0] = masks[0] | left_masks[0] | right_masks[0];
  var board_mask = (1 << size) - 1;

  while (i >= 0) {
    var m = ms[i] | (i + 2 < idx ? 2 : 0);
    ns = (m + 1) & ~m;
    if ((ns & board_mask) != 0) {
      if (i == size - 3) {
        solutions++;
        i--;
      } else {
        ms[i] |= ns;
        masks[i + 1] = masks[i] | ns;
        left_masks[i + 1] = (left_masks[i] | ns) << 1;
        right_masks[i + 1] = (right_masks[i] | ns) >> 1;
        ms[i + 1] = masks[i + 1] | left_masks[i + 1] | right_masks[i + 1];
        i++;
      }
    } else {
      i--;
    }
  }
  return solutions;
}

function nqueen_solver(
  size: i32,
  board_mask: i32,
  mask: i32,
  left_mask: i32,
  right_mask: i32,
  unique_solutions: Map<string, i32>,
): i32 {
  var masks = new Uint32Array(32);
  var left_masks = new Uint32Array(32);
  var right_masks = new Uint32Array(32);
  var ms = new Uint32Array(32);
  var ns: i32;
  var ns_array = new Uint32Array(32);
  var board_array = new Int32Array(32);
  var solutions = 0;
  var total_solutions = 0;
  var i: i32 = 0;
  var j: i32, k: i32;
  var border_mask = 0;
  var index: i32;

  var forbidden = new Uint32Array(size);

  masks[0] = mask;
  left_masks[0] = left_mask;
  right_masks[0] = right_mask;
  ms[0] = mask | left_mask | right_mask;
  ns_array[0] = mask;

  index = bit_scan(mask);
  for (j = 0; j < index; j++) {
    border_mask |= 1 << j;
    border_mask |= 1 << (size - j - 1);
  }

  for (k = 0; k < size; k++) {
    if (k == size - 2) {
      forbidden[k] = border_mask;
    } else if (k + 1 < index || k + 1 > size - index - 1) {
      forbidden[k] = 1 | (1 << (size - 1));
    } else {
      forbidden[k] = 0;
    }
  }

  while (i >= 0) {
    var m = ms[i] | forbidden[i];
    ns = (m + 1) & ~m;

    if ((ns & board_mask) != 0) {
      ns_array[i + 1] = ns;
      if (i == size - 2) {
        var repeat_times = 8;
        var rotate1 = false;
        var rotate2 = false;
        var rotate3 = false;

        if (ns_array[index] == 1 << (size - 1)) rotate1 = true;
        if (ns_array[size - index - 1] == 1) rotate2 = true;
        if (ns_array[size - 1] == 1 << (size - index - 1)) rotate3 = true;

        if (rotate1 || rotate2 || rotate3) {
          transform(ns_array, board_array, size);
          repeat_times = 8;
          var equal = true;
          var min_pos = size;
          var relation = 0;

          // rotate cw
          if (rotate1) {
            equal = true;
            relation = 0;
            for (j = 0; j < size; j++) {
              if (board_array[size - board_array[j] - 1] != j) {
                equal = false;
                if (min_pos > size - board_array[j] - 1) {
                  relation = board_array[size - board_array[j] - 1] - j;
                  min_pos = size - board_array[j] - 1;
                }
              }
            }

            repeat_times = equal ? 2 : repeat_times;
          }

          if (relation >= 0 && rotate2) {
            // rotate ccw
            equal = true;
            min_pos = size;
            relation = 0;
            for (j = 0; j < size; j++) {
              if (board_array[board_array[j]] != size - j - 1) {
                equal = false;
                if (min_pos > board_array[j]) {
                  relation = board_array[board_array[j]] - (size - j - 1);
                  min_pos = board_array[j];
                }
              }
            }

            repeat_times = equal ? 2 : repeat_times;
          }

          if (relation >= 0 && repeat_times == 8 && rotate3) {
            // rotate 180
            equal = true;
            min_pos = size;
            relation = 0;
            for (j = size - 1; j >= size / 2; j--) {
              if (board_array[size - j - 1] != size - board_array[j] - 1) {
                equal = false;
                relation =
                  board_array[size - j - 1] - (size - board_array[j] - 1);
                break;
              }
            }

            repeat_times = equal ? 4 : repeat_times;
          }

          total_solutions += relation >= 0 ? repeat_times : 0;
          solutions += relation >= 0 ? 1 : 0;
        } else {
          total_solutions += 8;
          solutions++;
        }

        i--;
      } else {
        ms[i] |= ns;
        masks[i + 1] = masks[i] | ns;
        left_masks[i + 1] = (left_masks[i] | ns) << 1;
        right_masks[i + 1] = (right_masks[i] | ns) >> 1;
        ms[i + 1] = masks[i + 1] | left_masks[i + 1] | right_masks[i + 1];
        i++;
      }
    } else {
      i--;
    }
  }

  unique_solutions.set('solutions', solutions);
  return total_solutions;
}

function nqueenJS(size: i32, unique_solutions: Map<string, i32>): i32 {
  var solutions: i32 = 0;
  var u_solutions = new Map<string, i32>();
  var i: i32;

  // get initial set of solutions
  for (i = 2; i < size; i++) {
    solutions += nqueen_solver1(size, i);
  }

  unique_solutions.set('solutions', solutions);
  solutions *= 8;

  // accound for symmetries
  for (i = 1; i < size / 2; i++) {
    solutions += nqueen_solver(
      size,
      (1 << size) - 1,
      1 << i,
      1 << (i + 1),
      (1 << i) >> 1,
      u_solutions,
    );

    unique_solutions.set(
      'solutions',
      unique_solutions.get('solutions') + u_solutions.get('solutions'),
    );
  }

  return solutions;
}

export function main(size: i32): void {
  var us = new Map<string, i32>();
  var result: i32 = nqueenJS(size, us);

  // console.log(result.toString());
}
