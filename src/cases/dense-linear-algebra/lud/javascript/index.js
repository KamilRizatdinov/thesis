var seed = 49734321;

function commonRandom() {
  // Robert Jenkins' 32 bit integer hash function.
  seed = (seed + 0x7ed55d16 + (seed << 12)) & 0xffffffff;
  seed = (seed ^ 0xc761c23c ^ (seed >>> 19)) & 0xffffffff;
  seed = (seed + 0x165667b1 + (seed << 5)) & 0xffffffff;
  seed = ((seed + 0xd3a2646c) ^ (seed << 9)) & 0xffffffff;
  seed = (seed + 0xfd7046c5 + (seed << 3)) & 0xffffffff;
  seed = (seed ^ 0xb55a4f09 ^ (seed >>> 16)) & 0xffffffff;
  return seed;
}

function commonRandomJS() {
  return Math.abs(commonRandom() / 0x7fffffff);
}

function randomMatrix(matrix) {
  var size = Math.sqrt(matrix.length);
  var l = new Float64Array(matrix.length);
  var u = new Float64Array(matrix.length);

  for (var i = 0; i < size; ++i) {
    for (var j = 0; j < size; ++j) {
      if (i > j) {
        l[i * size + j] = commonRandomJS();
      } else if (i == j) {
        l[i * size + j] = 1;
      } else {
        l[i * size + j] = 0;
      }
    }
  }
  for (var j = 0; j < size; ++j) {
    for (var i = 0; i < size; ++i) {
      if (i > j) {
        u[j * size + i] = 0;
      } else {
        u[j * size + i] = commonRandomJS();
      }
    }
  }
  for (var i = 0; i < size; ++i) {
    for (var j = 0; j < size; ++j) {
      var sum = 0;
      for (var k = 0; k < size; k++) {
        sum += l[i * size + k] * u[j * size + k];
      }
      matrix[i * size + j] = sum;
    }
  }
}

function lud(matrix, size) {
  var i, j, k;
  var sum;

  for (i = 0; i < size; ++i) {
    for (j = i; j < size; ++j) {
      sum = matrix[i * size + j];
      for (k = 0; k < i; ++k)
        sum -= matrix[i * size + k] * matrix[k * size + j];

      matrix[i * size + j] = sum;
    }

    for (j = i + 1; j < size; j++) {
      sum = matrix[j * size + i];
      for (k = 0; k < i; ++k)
        sum -= matrix[j * size + k] * matrix[k * size + i];
      matrix[j * size + i] = sum / matrix[i * size + i];
    }
  }
}

function printMatrix(matrix) {
  var size = Math.sqrt(matrix.length);
  for (var i = 0; i < size; ++i) {
    var row = [];
    for (var j = 0; j < size; ++j) {
      row.push(matrix[i * size + j]);
    }
    console.log(row.join(' '));
  }
}

export function main(size) {
  var matrix = new Float64Array(size * size);
  randomMatrix(matrix);
  lud(matrix, size);
  // printMatrix(matrix);
}

// function printStatus(fn) {
//   const status = %GetOptimizationStatus(fn);
//   console.log(status.toString(2).padStart(12, '0'));

//   if (status & (1 << 0)) {
//     console.log('is function');
//   }

//   if (status & (1 << 1)) {
//     console.log('is never optimized');
//   }

//   if (status & (1 << 2)) {
//     console.log('is always optimized');
//   }

//   if (status & (1 << 3)) {
//     console.log('is maybe deoptimized');
//   }

//   if (status & (1 << 4)) {
//     console.log('is optimized');
//   }

//   if (status & (1 << 5)) {
//     console.log('is optimized by TurboFan');
//   }

//   if (status & (1 << 6)) {
//     console.log('is interpreted');
//   }

//   if (status & (1 << 7)) {
//     console.log('is marked for optimization');
//   }

//   if (status & (1 << 8)) {
//     console.log('is marked for concurrent optimization');
//   }

//   if (status & (1 << 9)) {
//     console.log('is optimizing concurrently');
//   }

//   if (status & (1 << 10)) {
//     console.log('is executing');
//   }

//   if (status & (1 << 11)) {
//     console.log('topmost frame is turbo fanned');
//   }
// }

// for (let i = 0; i < 1000; i++) {
//   // printStatus(commonRandom); // 3 iter
//   // printStatus(commonRandomJS); // 3 iter
//   // printStatus(randomMatrix); // 4 iter
//   // printStatus(lud); // 5 iter
//   // printStatus(main); // never
//   main(300);
// }
