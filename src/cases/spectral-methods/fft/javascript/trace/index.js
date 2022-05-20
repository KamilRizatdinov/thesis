import {
  init,
  getFunctionsStatuses,
  formatResults,
  initHTML,
  getFunctionsStatusesHTML,
} from '../../../../../utils/trace';

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

function complexPolar(r, t) {
  return {r: r * Math.cos(t), i: r * Math.sin(t)};
}

function fftSimple(r, i) {
  var N = r.length;
  var R = new Float64Array(N);
  var I = new Float64Array(N);

  if (N === 1) {
    R[0] = r[0];
    I[0] = i[0];
    return {r: R, i: I};
  }

  var er = new Float64Array(N / 2);
  var ei = new Float64Array(N / 2);
  var dr = new Float64Array(N / 2);
  var di = new Float64Array(N / 2);

  for (var k = 0; k < N / 2; ++k) {
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

  for (var k = 0; k < r.length / 2; ++k) {
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

function transpose(m) {
  var tempr, tempi;
  var N = m.length;
  for (var i = 0; i < N; ++i) {
    for (var j = 0; j < i; ++j) {
      tempr = m[i]['r'][j];
      tempi = m[i]['i'][j];

      m[i]['r'][j] = m[j]['r'][i];
      m[i]['i'][j] = m[j]['i'][i];

      m[j]['r'][i] = tempr;
      m[j]['i'][i] = tempi;
    }
  }
}

function fft2D(m) {
  var M = [];
  for (var i = 0; i < m.length; ++i) {
    M[i] = fftSimple(m[i]['r'], m[i]['i']);
  }
  transpose(M);
  for (var i = 0; i < m.length; ++i) {
    M[i] = fftSimple(M[i]['r'], M[i]['i']);
  }
  transpose(M);
  return M;
}

function randomComplexArray(n) {
  // TA
  var r = new Float64Array(n);
  var i = new Float64Array(n);

  for (var j = 0; j < n; ++j) {
    r[j] = commonRandomJS() * 2 - 1;
    i[j] = commonRandomJS() * 2 - 1;
  }
  return {r: r, i: i};
}

function randomComplexMatrix(n) {
  var M = [];
  for (var i = 0; i < n; ++i) M[i] = randomComplexArray(n); // TA
  return M;
}

export function main(twoExp) {
  if (twoExp === undefined) {
    twoExp = 10;
  }

  if (twoExp < 0 || twoExp > 30) {
    throw new Error(
      "ERROR: invalid exponent of '" + twoExp + "' for input size",
    );
  }
  var n = 1 << twoExp;
  var data1D = randomComplexArray(n);
  var data2D = randomComplexMatrix(n);

  var results2D = fft2D(data2D);

  // console.log(results2D[0].i.join(' '));
  // console.log(results2D[0].r.join(' '));
}

init();

const functions = [
  commonRandom,
  commonRandomJS,
  complexPolar,
  fftSimple,
  fft2D,
  randomComplexArray,
  randomComplexMatrix,
  main,
];

let results = [];

for (let i = 0; i < 10; i++) {
  const statuses = getFunctionsStatuses(functions);
  const start = Date.now();
  main(10);
  const time = Date.now() - start;
  results.push(statuses.map(status => `${time},${i},${status}`));
}

console.log(formatResults(results));

// initHTML();

// const functions = [
//   commonRandom,
//   commonRandomJS,
//   complexPolar,
//   fftSimple,
//   fft2D,
//   randomComplexArray,
//   randomComplexMatrix,
//   main,
// ];

// let results = [];

// for (let i = 0; i < 10; i++) {
//   const statuses = getFunctionsStatusesHTML(functions);
//   const start = Date.now();
//   main(10);
//   const time = Date.now() - start;
//   results.push(
//     statuses.map(status => `<tr><td>${time}</td><td>${i}</td>${status}</tr>`),
//   );
// }

// console.log(formatResults(results));
// console.log('</table>');
