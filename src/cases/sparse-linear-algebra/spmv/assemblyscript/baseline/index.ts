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

function commonRandomJS(): f32 {
  const commonRand = <f32>commonRandom();
  return abs(commonRand / 0x7fffffff);
}

function randNorm(): f64 {
  return gaussian.nextGaussian();
}

function genRand(lb: i32, hb: i32): i32 {
  if (lb < 0 || hb < 0 || hb < lb) return 0;

  var range = hb - lb + 1;
  return (abs(commonRandom()) % range) + lb;
}

function rand(): f32 {
  var n = commonRandomJS() * <f32>(Math.pow(2, 32) - 1);
  return floor(n) ? floor(n) : ceil(n);
}

function randf(): f32 {
  return 1.0 - 2.0 * (rand() / 2147483648.0);
}

class Ziggurat {
  jsr: i32;

  wn: Float64Array;
  fn: Float64Array;
  kn: Int32Array;

  constructor() {
    this.jsr = 123456789;
    this.wn = new Float64Array(128);
    this.fn = new Float64Array(128);
    this.kn = new Int32Array(128);

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

  nfix(hz: i32, iz: i32): f64 {
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

  zigset(): void {
    // seed generator based on current time
    // jsr ^= new Date().getTime();

    var m1: f64 = 2147483648.0;
    var dn: f64 = 3.442619855899;
    var tn: f64 = dn;
    var vn: f64 = 9.91256303526217e-3;

    var q = vn / Math.exp(-0.5 * dn * dn);
    this.kn[0] = <i32>Math.floor((dn / q) * m1);
    this.kn[1] = 0;

    this.wn[0] = q / m1;
    this.wn[127] = dn / m1;

    this.fn[0] = 1.0;
    this.fn[127] = Math.exp(-0.5 * dn * dn);

    for (var i = 126; i >= 1; i--) {
      dn = Math.sqrt(-2.0 * Math.log(vn / dn + Math.exp(-0.5 * dn * dn)));
      this.kn[i + 1] = <i32>Math.floor((dn / tn) * m1);
      tn = dn;
      this.fn[i] = Math.exp(-0.5 * dn * dn);
      this.wn[i] = dn / m1;
    }
  }
}

var gaussian = new Ziggurat();

function sortArray(a: Int32Array, start: u32, finish: u32): void {
  // TA
  var t = a.slice(start, finish).sort(function (a, b) {
    return a - b;
  });
  for (var i = start; i < finish; ++i) {
    a[i] = t[i - start];
  }
}

class CSR {
  num_rows: i32;
  num_cols: i32;
  density_perc: f64;
  nz_per_row: f64;
  num_nonzeros: u32;
  stdev: f64;
  density_ppm: f64;
  Arow: Uint32Array;
  Acol: Int32Array;
  Ax: Float32Array;

  constructor(dim: i32, density: i32, stddev: f64) {
    this.num_rows = dim;
    this.num_cols = dim;
    this.density_perc = density / 10000.0;
    this.nz_per_row = (dim * density) / 1000000;
    this.num_nonzeros = <u32>Math.round(this.nz_per_row * dim);
    this.stdev = stddev * this.nz_per_row;
    this.Arow = new Uint32Array(this.num_rows + 1);
    this.Acol = new Int32Array(this.num_nonzeros); // TA
    this.Arow[0] = 0;

    var i: i32;
    var j: i32;
    var nnz_ith_row: u32;
    var nnz: i32;
    var update_interval: i32;
    var rand_col: i32;
    var nnz_ith_row_double: f64;
    var nz_error: f64;
    var nz_per_row_doubled: f64;
    var high_bound: f64;
    var used_cols: Int8Array;

    nnz = 0;
    nz_per_row_doubled = 2 * this.nz_per_row;
    high_bound = Math.min(this.num_cols, nz_per_row_doubled);
    used_cols = new Int8Array(this.num_cols);

    update_interval = <i32>Math.round(this.num_rows / 10.0);
    for (i = 0; i < this.num_rows; ++i) {
      nnz_ith_row_double = randNorm();
      nnz_ith_row_double *= this.stdev;
      nnz_ith_row_double += this.nz_per_row;

      if (nnz_ith_row_double < 0) nnz_ith_row = 0;
      else if (nnz_ith_row_double > high_bound) nnz_ith_row = <u32>high_bound;
      else nnz_ith_row = <u32>Math.abs(Math.round(nnz_ith_row_double));

      this.Arow[i + 1] = this.Arow[i] + nnz_ith_row;

      // no realloc in javascript typed arrays
      if (this.Arow[i + 1] > <u32>this.num_nonzeros) {
        var temp = this.Acol;
        this.Acol = new Int32Array(this.Arow[i + 1]); // TA
        this.Acol.set(temp, 0);
      }

      for (j = 0; j < this.num_cols; ++j) {
        used_cols[j] = 0;
      }

      for (j = 0; j < <i32>nnz_ith_row; ++j) {
        rand_col = genRand(0, this.num_cols - 1);
        if (used_cols[rand_col]) {
          --j;
        } else {
          this.Acol[this.Arow[i] + j] = rand_col;
          used_cols[rand_col] = 1;
        }
      }

      // sort the column entries
      sortArray(this.Acol, this.Arow[i], this.Arow[i + 1]); // TA
    }

    nz_error =
      Math.abs(this.num_nonzeros - this.Arow[this.num_rows]) /
      this.num_nonzeros;

    this.num_nonzeros = this.Arow[this.num_rows];

    this.density_perc =
      (this.num_nonzeros * 100.0) / (this.num_cols * this.num_rows);
    this.density_ppm = Math.round(this.density_perc * 10000.0);

    this.Ax = new Float32Array(this.num_nonzeros);
    for (i = 0; i < <i32>this.num_nonzeros; ++i) {
      this.Ax[i] = randf();
      while (this.Ax[i] === 0.0) {
        this.Ax[i] = randf();
      }
    }
  }
}

function spmv_csr(
  matrix: Float32Array,
  dim: i32,
  rowv: Uint32Array,
  colv: Int32Array,
  v: Float32Array,
  y: Float32Array,
  out: Float32Array,
): void {
  var row: i32;
  var row_start: u32;
  var row_end: u32;
  var jj: i32;
  var sum: f32 = 0.0;

  for (row = 0; row < dim; ++row) {
    sum = y[row];
    row_start = rowv[row];
    row_end = rowv[row + 1];

    for (jj = row_start; jj < <i32>row_end; ++jj) {
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
  var m = new CSR(dim, density, stddev);
  var v = new Float32Array(dim);
  var y = new Float32Array(dim);
  var out = new Float32Array(dim);
  var i: i32;

  for (i = 0; i < dim; i++) {
    v[i] = randf();
  }

  // console.log(v.join(' '));

  for (i = 0; i < iterations; ++i)
    spmv_csr(m.Ax, dim, m.Arow, m.Acol, v, y, out);

  // console.log(out.join('\n'));
}
