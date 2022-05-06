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

/* Ziggurat code taken from james bloomer's implementation that can be
 * found at  https://github.com/jamesbloomer/node-ziggurat
 */
class Ziggurat {
  jsr: i32;

  wn: Array<f64>;
  fn: Array<f64>;
  kn: Array<i32>;

  constructor() {
    this.jsr = 123456789;
    this.wn = this.wn.fill(0.0);
    this.fn = this.fn.fill(0.0);
    this.kn = this.kn.fill(0);

    this.zigset();
  }

  SHR3(): i32 {
    var jz = this.jsr;
    var jzr = this.jsr;
    jzr ^= jzr << 13;
    jzr ^= jzr >>> 17;
    jzr ^= jzr << 5;
    this.jsr = jzr;
    return (jz + jzr) | 0;
  }

  RNOR(): f64 {
    var hz = this.SHR3();
    var iz = hz & 127;
    return Math.abs(hz) < this.kn[iz] ? hz * this.wn[iz] : this.nfix(hz, iz);
  }

  UNI(): f64 {
    return 0.5 * (1 + this.SHR3() / -Math.pow(2, 31));
  }

  nextGaussian(): f64 {
    return this.RNOR();
  }

  nfix(hz: i32, iz: i32) {
    var r: f64 = 3.442619855899;
    var r1: f64 = 1.0 / r;
    var x: f64;
    var y: f64;

    while (true) {
      x = hz * this.wn[iz];
      if (iz == 0) {
        x = -Math.log(this.UNI()) * r1;
        y = -Math.log(this.UNI());
        while (y + y < x * x) {
          x = -Math.log(this.UNI()) * r1;
          y = -Math.log(this.UNI());
        }
        return hz > 0 ? r + x : -r - x;
      }

      if (
        this.fn[iz] + this.UNI() * (this.fn[iz - 1] - this.fn[iz]) <
        Math.exp(-0.5 * x * x)
      ) {
        return x;
      }
      hz = this.SHR3();
      iz = hz & 127;

      if (Math.abs(hz) < this.kn[iz]) {
        return hz * this.wn[iz];
      }
    }
  }

  zigset() {
    // seed generator based on current time
    // jsr ^= new Date().getTime();

    var m1: f64 = 2147483648.0;
    var dn: f64 = 3.442619855899;
    var tn: f64 = dn;
    var vn: f64 = 9.91256303526217e-3;

    var q = vn / Math.exp(-0.5 * dn * dn);
    this.kn[0] = Math.floor((dn / q) * m1);
    this.kn[1] = 0;

    this.wn[0] = q / m1;
    this.wn[127] = dn / m1;

    this.fn[0] = 1.0;
    this.fn[127] = Math.exp(-0.5 * dn * dn);

    for (var i = 126; i >= 1; i--) {
      dn = Math.sqrt(-2.0 * Math.log(vn / dn + Math.exp(-0.5 * dn * dn)));
      this.kn[i + 1] = Math.floor((dn / tn) * m1);
      tn = dn;
      this.fn[i] = Math.exp(-0.5 * dn * dn);
      this.wn[i] = dn / m1;
    }
  }
}

var gaussian = new Ziggurat();

function randNorm(): f64 {
  return gaussian.nextGaussian();
}

function genRand(lb: i32, hb: i32): i32 {
  if (lb < 0 || hb < 0 || hb < lb) return 0;

  var range = hb - lb + 1;
  return (rand() % range) + lb;
}

function rand(): i32 {
  var n = commonRandomJS() * (Math.pow(2, 32) - 1);
  return Math.floor(n) ? Math.floor(n) : Math.ceil(n);
}

function randf() {
  return 1.0 - 2.0 * (rand() / (2147483647 + 1.0));
}

function sortArray(a, start, finish) {
  // TA
  var t = ArrayOld.prototype.sort.call(
    a.subarray(start, finish),
    function (a, b) {
      return a - b;
    },
  );
  for (var i = start; i < finish; ++i) {
    a[i] = t[i - start];
  }
}

function generateRandomCSR(dim, density, stddev) {
  var i, j, nnz_ith_row, nnz, update_interval, rand_col;
  var nnz_ith_row_double, nz_error, nz_per_row_doubled, high_bound;
  var used_cols;
  var m = {};

  // lets figure out how many non zero entries we have
  m.num_rows = dim;
  m.num_cols = dim;
  m.density_perc = density / 10000.0;
  m.nz_per_row = (dim * density) / 1000000;
  m.num_nonzeros = Math.round(m.nz_per_row * dim);
  m.stdev = stddev * m.nz_per_row;

  m.Arow = new Uint32Array(m.num_rows + 1);
  m.Acol = new Uint32Array(m.num_nonzeros); // TA

  m.Arow[0] = 0;
  nnz = 0;
  nz_per_row_doubled = 2 * m.nz_per_row;
  high_bound = Math.min(m.num_cols, nz_per_row_doubled);
  used_cols = new Int8Array(m.num_cols);

  update_interval = Math.round(m.num_rows / 10.0);
  for (i = 0; i < m.num_rows; ++i) {
    if (i % update_interval == 0)
      console.log(i + ' rows of ' + m.num_rows + ' generated. Continuing...');

    nnz_ith_row_double = randNorm();
    nnz_ith_row_double *= m.stdev;
    nnz_ith_row_double += m.nz_per_row;

    if (nnz_ith_row_double < 0) nnz_ith_row = 0;
    else if (nnz_ith_row_double > high_bound) nnz_ith_row = high_bound;
    else nnz_ith_row = Math.abs(Math.round(nnz_ith_row_double));

    m.Arow[i + 1] = m.Arow[i] + nnz_ith_row;

    // no realloc in javascript typed arrays
    if (m.Arow[i + 1] > m.num_nonzeros) {
      var temp = m.Acol;
      m.Acol = new Int32Array(m.Arow[i + 1]); // TA
      m.Acol.set(temp, 0);
    }

    for (j = 0; j < m.num_cols; ++j) {
      used_cols[j] = 0;
    }

    for (j = 0; j < nnz_ith_row; ++j) {
      rand_col = genRand(0, m.num_cols - 1);
      if (used_cols[rand_col]) {
        --j;
      } else {
        m.Acol[m.Arow[i] + j] = rand_col;
        used_cols[rand_col] = 1;
      }
    }

    // sort the column entries
    sortArray(m.Acol, m.Arow[i], m.Arow[i + 1]); // TA
  }

  nz_error = Math.abs(m.num_nonzeros - m.Arow[m.num_rows]) / m.num_nonzeros;
  if (nz_error >= 0.5)
    console.log(
      'WARNING: Actual NNZ differs from Theoretical NNZ by' +
        nz_error * 100 +
        '%\n',
    );

  m.num_nonzeros = m.Arow[m.num_rows];
  console.log('Actual NUM_nonzeros: ' + m.num_nonzeros + '\n');

  m.density_perc = (m.num_nonzeros * 100.0) / (m.num_cols * m.num_rows);
  m.density_ppm = Math.round(m.density_perc * 10000.0);
  console.log('Actual Density: ' + m.density_perc + '% ppm: ' + m.density_ppm);

  m.Ax = new Float32Array(m.num_nonzeros);
  for (i = 0; i < m.num_nonzeros; ++i) {
    m.Ax[i] = randf();
    while (m.Ax[i] === 0.0) m.Ax[i] = randf();
  }
  return m;
}

function spmv_csr(matrix, dim, rowv, colv, v, y, out) {
  var row, row_start, row_end, jj;
  var sum = 0;

  for (row = 0; row < dim; ++row) {
    sum = y[row];
    row_start = rowv[row];
    row_end = rowv[row + 1];

    for (jj = row_start; jj < row_end; ++jj) {
      sum += matrix[jj] * v[colv[jj]];
    }

    out[row] = sum;
  }
}

export function main(
  dim: i32,
  density: i32,
  stddev: f64,
  iterations: i32,
): void {
  var m = generateRandomCSR(dim, density, stddev);
  var v = new Float32Array(dim);
  var y = new Float32Array(dim);
  var out = new Float32Array(dim);
  ArrayOld.prototype.forEach.call(v, function (n, i, a) {
    a[i] = randf();
  });

  for (var i = 0; i < iterations; ++i)
    spmv_csr(m.Ax, dim, m.Arow, m.Acol, v, y, out);
}
