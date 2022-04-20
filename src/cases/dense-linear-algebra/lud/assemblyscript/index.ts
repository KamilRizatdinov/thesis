/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014, Erick Lavoie, Faiz Khan, Sujay Kathrotia, Vincent
 * Foley-Bourgon, Laurie Hendren
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var seed = 49734321;

var commonRandom = (function (): () => i32 {
  return function (): i32 {
    // Robert Jenkins' 32 bit integer hash function.
    seed = (seed + 0x7ed55d16 + (seed << 12)) & 0xffffffff;
    seed = (seed ^ 0xc761c23c ^ (seed >>> 19)) & 0xffffffff;
    seed = (seed + 0x165667b1 + (seed << 5)) & 0xffffffff;
    seed = ((seed + 0xd3a2646c) ^ (seed << 9)) & 0xffffffff;
    seed = (seed + 0xfd7046c5 + (seed << 3)) & 0xffffffff;
    seed = (seed ^ 0xb55a4f09 ^ (seed >>> 16)) & 0xffffffff;
    return seed;
  };
})();

var commonRandomJS = function (): f64 {
  return Math.abs(commonRandom() / 0x7fffffff);
};

function randomMatrix(matrix: Float64Array): void {
  var size = <i32>Math.sqrt(matrix.length);
  var l = new Float64Array(matrix.length);
  var u = new Float64Array(matrix.length);
  var i: i32;
  var j: i32;
  var k: i32;

  for (i = 0; i < size; ++i) {
    for (j = 0; j < size; ++j) {
      if (i > j) {
        l[i * size + j] = commonRandomJS();
      } else if (i == j) {
        l[i * size + j] = 1;
      } else {
        l[i * size + j] = 0;
      }
    }
  }
  for (j = 0; j < size; ++j) {
    for (i = 0; i < size; ++i) {
      if (i > j) {
        u[j * size + i] = 0;
      } else {
        u[j * size + i] = commonRandomJS();
      }
    }
  }
  for (i = 0; i < size; ++i) {
    for (j = 0; j < size; ++j) {
      var sum: f64 = 0.0;
      for (k = 0; k < size; k++) {
        sum += l[i * size + k] * u[j * size + k];
      }
      matrix[i * size + j] = sum;
    }
  }
}

function lud(matrix: Float64Array, size: i32): void {
  var i: i32;
  var j: i32;
  var k: i32;
  var sum: f64;

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

export function ludRun(size: i32): void {
  var matrix = new Float64Array(size * size);
  randomMatrix(matrix);
  lud(matrix, size);
  console.log('done');
}
