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

class PolarCoord {
  r: f64;
  i: f64;
}

class PolarCoords {
  r: Float64Array;
  i: Float64Array;
}

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

function complexPolar(r: f64, t: f64): PolarCoord {
  return {r: r * Math.cos(t), i: r * Math.sin(t)};
}

function fftSimple(r: Float64Array, i: Float64Array): PolarCoords {
  var N = r.length;
  var R = new Float64Array(N);
  var I = new Float64Array(N);

  var k: i32;

  if (N === 1) {
    R[0] = r[0];
    I[0] = i[0];
    return {r: R, i: I};
  }

  var er = new Float64Array(N / 2);
  var ei = new Float64Array(N / 2);
  var dr = new Float64Array(N / 2);
  var di = new Float64Array(N / 2);

  for (k = 0; k < N / 2; ++k) {
    er[k] = r[2 * k];
    ei[k] = i[2 * k];
    dr[k] = r[2 * k + 1];
    di[k] = i[2 * k + 1];
  }

  var E = fftSimple(er, ei);
  var D = fftSimple(dr, di);
  var ER = E.r;
  var EI = E.i;
  var DR = D.r;
  var DI = D.i;

  for (k = 0; k < r.length / 2; ++k) {
    var c = complexPolar(1, (-2.0 * Math.PI * k) / N);
    var t = DR[k];
    DR[k] = t * c.r - DI[k] * c.i;
    DI[k] = t * c.i + DI[k] * c.r;
  }

  for (k = 0; k < N / 2; ++k) {
    R[k] = ER[k] + DR[k];
    I[k] = EI[k] + DI[k];

    R[k + N / 2] = ER[k] - DR[k];
    I[k + N / 2] = EI[k] - DI[k];
  }
  return {r: R, i: I};
}

function transpose(m: Array<PolarCoords>): void {
  var tempr: f64;
  var tempi: f64;
  var N = m.length;
  for (var i = 0; i < N; ++i) {
    for (var j = 0; j < i; ++j) {
      tempr = m[i].r[j];
      tempi = m[i].i[j];

      m[i].r[j] = m[j].r[i];
      m[i].i[j] = m[j].i[i];

      m[j].r[i] = tempr;
      m[j].i[i] = tempi;
    }
  }
}

function fft2D(m: Array<PolarCoords>): Array<PolarCoords> {
  var M = new Array<PolarCoords>(m.length);
  var i: i32;

  for (i = 0; i < m.length; ++i) {
    M[i] = fftSimple(m[i].r, m[i].i);
  }
  transpose(M);
  for (i = 0; i < m.length; ++i) {
    M[i] = fftSimple(M[i].r, M[i].i);
  }
  transpose(M);
  return M;
}

function randomComplexArray(n: i32): PolarCoords {
  // TA
  var r = new Float64Array(n);
  var i = new Float64Array(n);

  for (var j = 0; j < n; ++j) {
    r[j] = commonRandomJS() * 2 - 1;
    i[j] = commonRandomJS() * 2 - 1;
  }
  return {r: r, i: i};
}

function randomComplexMatrix(n: i32): Array<PolarCoords> {
  var M = new Array<PolarCoords>(n);
  for (var i = 0; i < n; ++i) M[i] = randomComplexArray(n); // TA
  return M;
}

export function main(twoExp: i32 = 10): void {
  var n: i32 = 1 << twoExp;
  var data1D = randomComplexArray(n);
  var data2D = randomComplexMatrix(n);

  var results2D = fft2D(data2D);
}
