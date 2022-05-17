let seed = 49734321;

function commonRandom(): i32 {
  // Robert Jenkins' 32 bit integer hash function.
  seed = (seed + 0x7ed55d16 + (seed << 12)) & 0xffffffff;
  seed = (seed ^ 0xc761c23c ^ (seed >>> 19)) & 0xffffffff;
  seed = (seed + 0x165667b1 + (seed << 5)) & 0xffffffff;
  seed = ((seed + 0xd3a2646c) ^ (seed << 9)) & 0xffffffff;
  seed = (seed + 0xfd7046c5 + (seed << 3)) & 0xffffffff;
  seed = (seed ^ 0xb55a4f09 ^ (seed >>> 16)) & 0xffffffff;
  return seed;
}

function commonRandomJS(): f64 {
  const commonRand = <f64>commonRandom();
  return Math.abs(commonRand / 0x7fffffff);
}

function randomMatrix(matrix: StaticArray<f64>): void {
  var size = <i32>Math.sqrt(matrix.length);
  var l = new StaticArray<f64>(matrix.length);
  var u = new StaticArray<f64>(matrix.length);
  var i: i32;
  var j: i32;
  var k: i32;

  for (i = 0; i < size; ++i) {
    for (j = 0; j < size; ++j) {
      if (i > j) {
        unchecked((l[i * size + j] = commonRandomJS()));
      } else if (i == j) {
        unchecked((l[i * size + j] = 1));
      } else {
        unchecked((l[i * size + j] = 0));
      }
    }
  }
  for (j = 0; j < size; ++j) {
    for (i = 0; i < size; ++i) {
      if (i > j) {
        unchecked((u[j * size + i] = 0));
      } else {
        unchecked((u[j * size + i] = commonRandomJS()));
      }
    }
  }
  for (i = 0; i < size; ++i) {
    for (j = 0; j < size; ++j) {
      var sum: f64 = 0.0;
      for (k = 0; k < size; k++) {
        sum += unchecked(l[i * size + k] * u[j * size + k]);
      }
      unchecked((matrix[i * size + j] = sum));
    }
  }
}

function lud(matrix: StaticArray<f64>, size: i32): void {
  var i: i32;
  var j: i32;
  var k: i32;
  var sum: f64;

  for (i = 0; i < size; ++i) {
    for (j = i; j < size; ++j) {
      sum = unchecked(matrix[i * size + j]);
      for (k = 0; k < i; ++k)
        sum -= unchecked(matrix[i * size + k] * matrix[k * size + j]);

      unchecked((matrix[i * size + j] = sum));
    }

    for (j = i + 1; j < size; j++) {
      sum = unchecked(matrix[j * size + i]);
      for (k = 0; k < i; ++k)
        sum -= unchecked(matrix[j * size + k] * matrix[k * size + i]);
      unchecked((matrix[j * size + i] = sum / matrix[i * size + i]));
    }
  }
}

function printMatrix(matrix: StaticArray<f64>): void {
  var size = <i32>Math.sqrt(matrix.length);
  var i: i32;
  var j: i32;

  for (i = 0; i < size; ++i) {
    var row = new StaticArray<f64>(size);
    for (j = 0; j < size; ++j) {
      unchecked((row[j] = matrix[i * size + j]));
    }
    console.log(row.join(' '));
  }
}

export function main(size: i32): void {
  var matrix = new StaticArray<f64>(size * size);
  randomMatrix(matrix);
  lud(matrix, size);
  // printMatrix(matrix);
}
