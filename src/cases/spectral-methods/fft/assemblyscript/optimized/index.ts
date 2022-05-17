class PolarCoord {
  r: f64;
  i: f64;
}

class PolarCoords {
  r: StaticArray<f64>;
  i: StaticArray<f64>;
}

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

function complexPolar(r: f64, t: f64): PolarCoord {
  return {r: r * Math.cos(t), i: r * Math.sin(t)};
}

function fftSimple(r: StaticArray<f64>, i: StaticArray<f64>): PolarCoords {
  var N = r.length;
  var R = new StaticArray<f64>(N);
  var I = new StaticArray<f64>(N);

  var k: i32;

  if (N === 1) {
    unchecked((R[0] = r[0]));
    unchecked((I[0] = i[0]));
    return {r: R, i: I};
  }

  var er = new StaticArray<f64>(N / 2);
  var ei = new StaticArray<f64>(N / 2);
  var dr = new StaticArray<f64>(N / 2);
  var di = new StaticArray<f64>(N / 2);

  for (k = 0; k < N / 2; ++k) {
    unchecked((er[k] = r[2 * k]));
    unchecked((ei[k] = i[2 * k]));
    unchecked((dr[k] = r[2 * k + 1]));
    unchecked((di[k] = i[2 * k + 1]));
  }

  var E = fftSimple(er, ei);
  var D = fftSimple(dr, di);
  var ER = E.r;
  var EI = E.i;
  var DR = D.r;
  var DI = D.i;

  for (k = 0; k < r.length / 2; ++k) {
    var c = complexPolar(1, (-2.0 * Math.PI * k) / N);
    var t = unchecked(DR[k]);
    unchecked((DR[k] = t * c.r - DI[k] * c.i));
    unchecked((DI[k] = t * c.i + DI[k] * c.r));
  }

  for (k = 0; k < N / 2; ++k) {
    unchecked((R[k] = ER[k] + DR[k]));
    unchecked((I[k] = EI[k] + DI[k]));

    unchecked((R[k + N / 2] = ER[k] - DR[k]));
    unchecked((I[k + N / 2] = EI[k] - DI[k]));
  }
  return {r: R, i: I};
}

function transpose(m: Array<PolarCoords>): void {
  var tempr: f64;
  var tempi: f64;
  var N = m.length;
  for (var i = 0; i < N; ++i) {
    for (var j = 0; j < i; ++j) {
      tempr = unchecked(m[i].r[j]);
      tempi = unchecked(m[i].i[j]);

      unchecked((m[i].r[j] = m[j].r[i]));
      unchecked((m[i].i[j] = m[j].i[i]));

      unchecked((m[j].r[i] = tempr));
      unchecked((m[j].i[i] = tempi));
    }
  }
}

function fft2D(m: Array<PolarCoords>): Array<PolarCoords> {
  var M = new Array<PolarCoords>(m.length);
  var i: i32;

  for (i = 0; i < m.length; ++i) {
    unchecked((M[i] = fftSimple(m[i].r, m[i].i)));
  }
  transpose(M);
  for (i = 0; i < m.length; ++i) {
    unchecked((M[i] = fftSimple(M[i].r, M[i].i)));
  }
  transpose(M);
  return M;
}

function randomComplexArray(n: i32): PolarCoords {
  // TA
  var r = new StaticArray<f64>(n);
  var i = new StaticArray<f64>(n);

  for (var j = 0; j < n; ++j) {
    unchecked((r[j] = commonRandomJS() * 2 - 1));
    unchecked((i[j] = commonRandomJS() * 2 - 1));
  }
  return {r: r, i: i};
}

function randomComplexMatrix(n: i32): Array<PolarCoords> {
  var M = new Array<PolarCoords>(n);
  for (var i = 0; i < n; ++i) unchecked((M[i] = randomComplexArray(n))); // TA
  return M;
}

export function main(twoExp: i32 = 10): void {
  var n: i32 = 1 << twoExp;
  var data1D = randomComplexArray(n);
  var data2D = randomComplexMatrix(n);

  var results2D = fft2D(data2D);
}
