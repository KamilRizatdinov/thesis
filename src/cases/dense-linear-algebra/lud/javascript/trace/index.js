import {init, getFunctionsStatuses} from '../../../../../utils/trace';

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

init();
for (let i = 0; i < 50; i++) {
  console.log(
    getFunctionsStatuses([
      // commonRandom,
      // commonRandomJS,
      // randomMatrix,
      // lud,
      main,
    ]).join('\n'),
  );

  main(300);
}
