var Nr: i32 = 502;
var Nc: i32 = 458;
var Ne: i32 = Nr * Nc;

var i: i32;
var j: i32;
var iter: i32;
var L: f32;

var r1 = 0; // top row index of ROI
var r2 = Nr - 1; // bottom row index of ROI
var c1 = 0; // left column index of ROI
var c2 = Nc - 1; // right column index of ROI

// ROI image size
var NeROI: f32 = <f32>((r2 - r1 + 1) * (c2 - c1 + 1)); // number of elements in ROI, ROI size

// allocate variables for surrounding pixels
var iN = new StaticArray<i32>(Nr); // north surrounding element
var iS = new StaticArray<i32>(Nr); // south surrounding element
var jW = new StaticArray<i32>(Nc); // west surrounding element
var jE = new StaticArray<i32>(Nc); // east surrounding element

// allocate variables for directional derivatives
var dN = new StaticArray<f32>(Ne); // north direction derivative
var dS = new StaticArray<f32>(Ne); // south direction derivative
var dW = new StaticArray<f32>(Ne); // west direction derivative
var dE = new StaticArray<f32>(Ne); // east direction derivative

// allocate variable for diffusion coefficient
var c = new StaticArray<f32>(Ne); // diffusion coefficient
// N/S/W/E indices of surrounding pixels (every element of IMAGE)
for (i = 0; i < Nr; i++) {
  unchecked((iN[i] = i - 1)); // holds index of IMAGE row above
  unchecked((iS[i] = i + 1)); // holds index of IMAGE row below
}
for (j = 0; j < Nc; j++) {
  unchecked((jW[j] = j - 1)); // holds index of IMAGE column on the left
  unchecked((jE[j] = j + 1)); // holds index of IMAGE column on the right
}
// N/S/W/E boundary conditions, fix surrounding indices outside boundary of IMAGE
unchecked((iN[0] = 0)); // changes IMAGE top row index from -1 to 0
unchecked((iS[Nr - 1] = Nr - 1)); // changes IMAGE bottom row index from Nr to Nr-1
unchecked((jW[0] = 0)); // changes IMAGE leftmost column index from -1 to 0
unchecked((jE[Nc - 1] = Nc - 1)); // changes IMAGE rightmost column index from Nc to Nc-1

/* Get image data */
// var img = document.getElementById("image");
// var canvas = document.getElementById("canvas");
// var ctx = canvas.getContext("2d");

var image = new StaticArray<f32>(Ne);
var data = new StaticArray<f32>(Ne);
var q0sqr: f32;

//write image
function writeImage(): void {
  for (i = 0; i < Ne; i++) {
    unchecked((data[i] = <f32>((<i32>Math.log(image[i]) * 255) | 0)));
  }
}

function calculateSum(): void {
  var sum: f32 = 0.0;
  var sum2: f32 = 0.0;
  for (i = r1; i <= r2; i++) {
    // do for the range of rows in ROI
    for (j = c1; j <= c2; j++) {
      // do for the range of columns in ROI
      var tmp = unchecked(image[i + Nr * j]); // get coresponding value in IMAGE
      sum += tmp; // take corresponding value and add to sum
      sum2 += tmp * tmp; // take square of corresponding value and add to sum2
    }
  }
  var meanROI = sum / NeROI; // gets mean (average) value of element in ROI
  var varROI = sum2 / NeROI - meanROI * meanROI; // gets variance of ROI
  q0sqr = varROI / (meanROI * meanROI); // gets standard deviation of ROI
}

function calculateDiffusion(): void {
  for (j = 0; j < Nc; j++) {
    // do for the range of columns in IMAGE
    for (i = 0; i < Nr; i++) {
      // do for the range of rows in IMAGE
      // current index/pixel
      var k = i + Nr * j; // get position of current element
      var Jc = image[k]; // get value of the current element
      // directional derivates (every element of IMAGE)
      unchecked((dN[k] = image[iN[i] + Nr * j] - Jc)); // north direction derivative
      unchecked((dS[k] = image[iS[i] + Nr * j] - Jc)); // south direction derivative
      unchecked((dW[k] = image[i + Nr * jW[j]] - Jc)); // west direction derivative
      unchecked((dE[k] = image[i + Nr * jE[j]] - Jc)); // east direction derivative

      // normalized discrete gradient mag squared (equ 52,53)
      var G2 =
        unchecked(
          dN[k] * dN[k] +
            dS[k] * dS[k] + // gradient (based on derivatives)
            dW[k] * dW[k] +
            dE[k] * dE[k],
        ) /
        (Jc * Jc);
      // normalized discrete laplacian (equ 54)
      L = unchecked(dN[k] + dS[k] + dW[k] + dE[k]) / Jc; // laplacian (based on derivatives)

      // ICOV (equ 31/35)
      var num: f32 = 0.5 * G2 - (1.0 / 16.0) * (L * L); // num (based on gradient and laplacian)
      var den: f32 = 1 + 0.25 * L; // den (based on laplacian)
      var qsqr: f32 = num / (den * den); // qsqr (based on num and den)

      // diffusion coefficent (equ 33) (every element of IMAGE)
      den = (qsqr - q0sqr) / (q0sqr * (1 + q0sqr)); // den (based on qsqr and q0sqr)
      unchecked((c[k] = <f32>(1.0 / (1.0 + den)))); // diffusion coefficient (based on den)

      // saturate diffusion coefficent to 0-1 range
      if (unchecked(c[k]) < 0) {
        // if diffusion coefficient < 0
        unchecked((c[k] = 0));
      } // ... set to 0
      else if (unchecked(c[k]) > 1) {
        // if diffusion coefficient > 1
        unchecked((c[k] = 1));
      } // ... set to 1
    }
  }
}

function adjustValues(lambda: f32): void {
  lambda = 0.25 * lambda;
  for (j = 0; j < Nc; j++) {
    // do for the range of columns in IMAGE
    // printf("NUMBER OF THREADS: %d\n", omp_get_num_threads());
    for (i = 0; i < Nr; i++) {
      // do for the range of rows in IMAGE
      // current index
      var k = i + Nr * j; // get position of current element
      // diffusion coefficent
      var cN = unchecked(c[k]); // north diffusion coefficient
      var cS = unchecked(c[iS[i] + Nr * j]); // south diffusion coefficient
      var cW = unchecked(c[k]); // west diffusion coefficient
      var cE = unchecked(c[i + Nr * jE[j]]); // east diffusion coefficient
      // divergence (equ 58)
      var D =
        cN * unchecked(dN[k] + cS * dS[k]) + cW * unchecked(dW[k] + cE * dE[k]); // divergence
      // image update (equ 61) (every element of IMAGE)
      unchecked((image[k] = image[k] + lambda * D)); // updates image (based on input time step and divergence)
    }
  }
}

function SRAD(niter: i32, lambda: f32): void {
  for (iter = 0; iter < niter; iter++) {
    calculateSum();
    // directional derivatives, ICOV, diffusion coefficent

    calculateDiffusion();
    // divergence & image update

    adjustValues(lambda);
  }
}

export function main(niter: i32, lambda: f32): void {
  var output: f32 = 0.0;
  var image = new StaticArray<f32>(Ne);
  for (i = 0; i < Ne; i++) {
    unchecked((image[i] = <f32>Math.exp(data[i] / 255)));
  }
  SRAD(niter, lambda);
  writeImage();

  for (i = 0; i < Nr; i++) {
    output = output + unchecked(data[i]);
  }

  // console.log(output.toString());
}
