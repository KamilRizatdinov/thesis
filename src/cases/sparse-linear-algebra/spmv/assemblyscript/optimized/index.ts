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

  wn: StaticArray<f64>;
  fn: StaticArray<f64>;
  kn: StaticArray<i32>;

  constructor() {
    this.jsr = 123456789;
    this.wn = new StaticArray<f64>(128);
    this.fn = new StaticArray<f64>(128);
    this.kn = new StaticArray<i32>(128);

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
    return Math.abs(hz) < unchecked(this.kn[iz])
      ? hz * unchecked(this.wn[iz])
      : this.nfix(hz, iz);
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
      x = hz * unchecked(this.wn[iz]);
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
        unchecked(this.fn[iz]) +
          this.UNI() * (unchecked(this.fn[iz - 1]) - unchecked(this.fn[iz])) <
        Math.exp(-0.5 * x * x)
      ) {
        return x;
      }
      hz = this.SHR3();
      iz = hz & 127;

      if (Math.abs(hz) < unchecked(this.kn[iz])) {
        return hz * unchecked(this.wn[iz]);
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
    unchecked((this.kn[0] = <i32>Math.floor((dn / q) * m1)));
    unchecked((this.kn[1] = 0));

    unchecked((this.wn[0] = q / m1));
    unchecked((this.wn[127] = dn / m1));

    unchecked((this.fn[0] = 1.0));
    unchecked((this.fn[127] = Math.exp(-0.5 * dn * dn)));

    for (var i = 126; i >= 1; i--) {
      dn = Math.sqrt(-2.0 * Math.log(vn / dn + Math.exp(-0.5 * dn * dn)));
      unchecked((this.kn[i + 1] = <i32>Math.floor((dn / tn) * m1)));
      tn = dn;
      unchecked((this.fn[i] = Math.exp(-0.5 * dn * dn)));
      unchecked((this.wn[i] = dn / m1));
    }
  }
}

var gaussian = new Ziggurat();

function sortArray(a: StaticArray<i32>, start: u32, finish: u32): void {
  // TA
  var t = a.slice(start, finish).sort(function (a, b) {
    return a - b;
  });
  for (var i = start; i < finish; ++i) {
    unchecked((a[i] = t[i - start]));
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
  Arow: StaticArray<u32>;
  Acol: StaticArray<i32>;
  Ax: StaticArray<f32>;

  constructor(dim: i32, density: i32, stddev: f64) {
    this.num_rows = dim;
    this.num_cols = dim;
    this.density_perc = density / 10000.0;
    this.nz_per_row = (dim * density) / 1000000;
    this.num_nonzeros = <u32>Math.round(this.nz_per_row * dim);
    this.stdev = stddev * this.nz_per_row;
    this.Arow = new StaticArray<u32>(this.num_rows + 1);
    this.Acol = new StaticArray<i32>(this.num_nonzeros); // TA
    unchecked((this.Arow[0] = 0));

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
    var used_cols: StaticArray<i8>;

    nnz = 0;
    nz_per_row_doubled = 2 * this.nz_per_row;
    high_bound = Math.min(this.num_cols, nz_per_row_doubled);
    used_cols = new StaticArray<i8>(this.num_cols);

    update_interval = <i32>Math.round(this.num_rows / 10.0);
    for (i = 0; i < this.num_rows; ++i) {
      nnz_ith_row_double = randNorm();
      nnz_ith_row_double *= this.stdev;
      nnz_ith_row_double += this.nz_per_row;

      if (nnz_ith_row_double < 0) nnz_ith_row = 0;
      else if (nnz_ith_row_double > high_bound) nnz_ith_row = <u32>high_bound;
      else nnz_ith_row = <u32>Math.abs(Math.round(nnz_ith_row_double));

      unchecked((this.Arow[i + 1] = this.Arow[i] + nnz_ith_row));

      // no realloc in javascript typed arrays
      if (unchecked(this.Arow[i + 1]) > <u32>this.num_nonzeros) {
        var temp = this.Acol;
        this.Acol = new StaticArray<i32>(unchecked(this.Arow[i + 1])); // TA
        for (j = 0; j < i + 1; j++) {
          unchecked((this.Acol[j] = temp[j]));
        }
      }

      for (j = 0; j < this.num_cols; ++j) {
        unchecked((used_cols[j] = 0));
      }

      for (j = 0; j < <i32>nnz_ith_row; ++j) {
        rand_col = genRand(0, this.num_cols - 1);
        if (unchecked(used_cols[rand_col])) {
          --j;
        } else {
          unchecked((this.Acol[this.Arow[i] + j] = rand_col));
          unchecked((used_cols[rand_col] = 1));
        }
      }

      // sort the column entries
      sortArray(
        this.Acol,
        unchecked(this.Arow[i]),
        unchecked(this.Arow[i + 1]),
      ); // TA
    }

    nz_error =
      Math.abs(this.num_nonzeros - unchecked(this.Arow[this.num_rows])) /
      this.num_nonzeros;

    this.num_nonzeros = unchecked(this.Arow[this.num_rows]);

    this.density_perc =
      (this.num_nonzeros * 100.0) / (this.num_cols * this.num_rows);
    this.density_ppm = Math.round(this.density_perc * 10000.0);

    this.Ax = new StaticArray<f32>(this.num_nonzeros);
    for (i = 0; i < <i32>this.num_nonzeros; ++i) {
      unchecked((this.Ax[i] = randf()));
      while (unchecked(this.Ax[i] === 0.0)) unchecked((this.Ax[i] = randf()));
    }
  }
}

function spmv_csr(
  matrix: StaticArray<f32>,
  dim: i32,
  rowv: StaticArray<u32>,
  colv: StaticArray<i32>,
  v: StaticArray<f32>,
  y: StaticArray<f32>,
  out: StaticArray<f32>,
): void {
  var row: i32;
  var row_start: u32;
  var row_end: u32;
  var jj: i32;
  var sum: f32 = 0.0;

  for (row = 0; row < dim; ++row) {
    sum = unchecked(y[row]);
    row_start = unchecked(rowv[row]);
    row_end = unchecked(rowv[row + 1]);

    for (jj = row_start; jj < <i32>row_end; ++jj) {
      sum += unchecked(matrix[jj] * v[colv[jj]]);
    }

    unchecked((out[row] = sum));
  }
}

export function main(
  dim: i32,
  density: i32,
  stddev: f64,
  iterations: i32,
): void {
  var m = new CSR(dim, density, stddev);
  var v = new StaticArray<f32>(dim);
  var y = new StaticArray<f32>(dim);
  var out = new StaticArray<f32>(dim);
  var i: i32;

  for (i = 0; i < dim; i++) {
    unchecked((v[i] = randf()));
  }

  // console.log(v.join(' '));

  for (i = 0; i < iterations; ++i)
    spmv_csr(m.Ax, dim, m.Arow, m.Acol, v, y, out);

  // console.log(out.join('\n'));
}
