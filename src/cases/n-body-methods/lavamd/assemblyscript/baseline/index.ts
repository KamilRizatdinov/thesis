var NUMBER_PAR_PER_BOX = 100;

class Box {
  x: f64;
  y: f64;
  z: f64;
  v: f64;
  number: f64;
  offset: f64;
  nn: i32;
  nei: Array<Box>;
}

class DimCPU {
  cores_arg: i32;
  boxes1d_arg: i32;
  number_boxes: i32;
  space_elem: i32;
}

class ParCPU {
  alpha: f64;
}

let seed: i32 = 49734321;

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

function DOT(A: Box, B: Box): f64 {
  return A.x * B.x + A.y * B.y + A.z * B.z;
}

function createArray(creator: () => Box, size: i32): Array<Box> {
  var arr = new Array<Box>(size);
  for (var i = 0; i < size; i++) {
    arr[i] = creator();
  }
  return arr;
}

function nei_str(): Box {
  // neighbor box
  return {
    x: 0.0,
    y: 0.0,
    z: 0.0,
    v: 0.0,
    number: 0.0,
    offset: 0.0,
    nei: new Array<Box>(),
    nn: 0,
  };
}

function box_str(): Box {
  // home box
  return {
    x: 0.0,
    y: 0.0,
    z: 0.0,
    v: 0.0,
    number: 0.0,
    offset: 0.0,
    // neighbor boxes
    nn: 0,
    nei: createArray(nei_str, 26),
  };
}

function space_mem(): Box {
  return {
    x: 0.0,
    y: 0.0,
    z: 0.0,
    v: 0.0,
    number: 0,
    offset: 0,
    nei: new Array<Box>(),
    nn: 0,
  };
}

function lavamd(boxes1d: i32): void {
  // counters
  var i: i32;
  var j: i32;
  var k: i32;
  var l: i32;
  var m: i32;
  var n: i32;

  // system memory
  var par_cpu: ParCPU = {
    alpha: 0.5,
  };
  var dim_cpu: DimCPU = {
    cores_arg: 0,
    boxes1d_arg: 0,
    number_boxes: 0,
    space_elem: 0,
  };
  var box_cpu: Array<Box>;
  var rv_cpu: Array<Box>;
  var qv_cpu: Float64Array;
  var fv_cpu: Array<Box>;
  var nh: i32;

  // assign default values
  dim_cpu.cores_arg = 1;
  dim_cpu.boxes1d_arg = boxes1d || 1;

  if (dim_cpu.boxes1d_arg < 0) {
    console.log('ERROR: Wrong value to -boxes1d parameter, cannot be <=0');
    return;
  }

  // DIMENSIONS
  // total number of boxes
  dim_cpu.number_boxes =
    dim_cpu.boxes1d_arg * dim_cpu.boxes1d_arg * dim_cpu.boxes1d_arg;

  // how many particles space has in each direction
  dim_cpu.space_elem = dim_cpu.number_boxes * NUMBER_PAR_PER_BOX;

  // BOX
  box_cpu = createArray(box_str, dim_cpu.number_boxes); // allocate boxes
  // initialize number of home boxes
  nh = 0;

  // home boxes in z direction
  for (i = 0; i < dim_cpu.boxes1d_arg; i++) {
    // home boxes in y direction
    for (j = 0; j < dim_cpu.boxes1d_arg; j++) {
      // home boxes in x direction
      for (k = 0; k < dim_cpu.boxes1d_arg; k++) {
        // current home box
        box_cpu[nh].x = k;
        box_cpu[nh].y = j;
        box_cpu[nh].z = i;
        box_cpu[nh].number = nh;
        box_cpu[nh].offset = nh * NUMBER_PAR_PER_BOX;

        // initialize number of neighbor boxes
        box_cpu[nh].nn = 0;

        // neighbor boxes in z direction
        for (l = -1; l < 2; l++) {
          // neighbor boxes in y direction
          for (m = -1; m < 2; m++) {
            // neighbor boxes in x direction
            for (n = -1; n < 2; n++) {
              // check if (this neighbor exists) and (it is not the same as home box)
              if (
                (i + l >= 0 && j + m >= 0 && k + n >= 0) == true &&
                (i + l < dim_cpu.boxes1d_arg &&
                  j + m < dim_cpu.boxes1d_arg &&
                  k + n < dim_cpu.boxes1d_arg) == true &&
                (l == 0 && m == 0 && n == 0) == false
              ) {
                // current neighbor box
                box_cpu[nh].nei[box_cpu[nh].nn].x = k + n;
                box_cpu[nh].nei[box_cpu[nh].nn].y = j + m;
                box_cpu[nh].nei[box_cpu[nh].nn].z = i + l;
                box_cpu[nh].nei[box_cpu[nh].nn].number =
                  box_cpu[nh].nei[box_cpu[nh].nn].z *
                    dim_cpu.boxes1d_arg *
                    dim_cpu.boxes1d_arg +
                  box_cpu[nh].nei[box_cpu[nh].nn].y * dim_cpu.boxes1d_arg +
                  box_cpu[nh].nei[box_cpu[nh].nn].x;
                box_cpu[nh].nei[box_cpu[nh].nn].offset =
                  box_cpu[nh].nei[box_cpu[nh].nn].number * NUMBER_PAR_PER_BOX;

                // increment neighbor box
                box_cpu[nh].nn = box_cpu[nh].nn + 1;
              }
            } // neighbor boxes in x direction
          } // neighbor boxes in y direction
        } // neighbor boxes in z direction
        // increment home box
        nh = nh + 1;
      } // home boxes in x direction
    } // home boxes in y direction
  } // home boxes in z direction

  //  PARAMETERS, DISTANCE, CHARGE AND FORCE
  // input (distances)
  rv_cpu = createArray(space_mem, dim_cpu.space_elem); //(FOUR_VECTOR*)malloc(dim_cpu.space_mem);
  for (i = 0; i < dim_cpu.space_elem; i = i + 1) {
    rv_cpu[i].v = ((commonRandom() % 10) + 1) / 10.0; // get a number in the range 0.1 - 1.0
    rv_cpu[i].x = ((commonRandom() % 10) + 1) / 10.0; // get a number in the range 0.1 - 1.0
    rv_cpu[i].y = ((commonRandom() % 10) + 1) / 10.0; // get a number in the range 0.1 - 1.0
    rv_cpu[i].z = ((commonRandom() % 10) + 1) / 10.0; // get a number in the range 0.1 - 1.0
  }

  // input (charge)
  qv_cpu = new Float64Array(dim_cpu.space_elem); // (fp*)malloc(dim_cpu.space_mem2);
  for (i = 0; i < dim_cpu.space_elem; i = i + 1) {
    qv_cpu[i] = <f64>((commonRandom() % 10) + 1) / 10; // get a number in the range 0.1 - 1.0
  }

  // output (forces)
  fv_cpu = createArray(space_mem, dim_cpu.space_elem); //(FOUR_VECTOR*)malloc(dim_cpu.space_mem);

  kernel_cpu(par_cpu, dim_cpu, box_cpu, rv_cpu, qv_cpu, fv_cpu);

  // console.log(`par_cpu: [${par_cpu.alpha.toString()}]`);
  // console.log(
  //   `dim_cpu: [${dim_cpu.boxes1d_arg.toString()}, ${dim_cpu.cores_arg.toString()}, ${dim_cpu.number_boxes.toString()}, ${dim_cpu.space_elem.toString()}]`,
  // );
  // console.log(
  //   box_cpu
  //     .map<string>(
  //       box =>
  //         `${box.nn.toString()}, ${box.number.toString()} ${box.offset.toString()} ${box.v.toString()} ${box.x.toString()} ${box.y.toString()} ${box.z.toString()}`,
  //     )
  //     .join('\n'),
  // );
  // console.log(
  //   rv_cpu
  //     .map<string>(
  //       box =>
  //         `${box.nn.toString()}, ${box.number.toString()} ${box.offset.toString()} ${box.v.toString()} ${box.x.toString()} ${box.y.toString()} ${box.z.toString()}`,
  //     )
  //     .join('\n'),
  // );
  // console.log(
  //   fv_cpu
  //     .map<string>(
  //       box =>
  //         `${box.nn.toString()}, ${box.number.toString()} ${box.offset.toString()} ${box.v.toString()} ${box.x.toString()} ${box.y.toString()} ${box.z.toString()}`,
  //     )
  //     .join('\n'),
  // );
  // console.log(qv_cpu.join(' '));

  var sum = space_mem();
}

function kernel_cpu(
  par: ParCPU,
  dim: DimCPU,
  box: Array<Box>,
  rv: Array<Box>,
  qv: Float64Array,
  fv: Array<Box>,
): void {
  // parameters
  var alpha: f64;
  var a2: f64;

  // counters
  var i: i32;
  var j: i32;
  var k: i32;
  var l: i32;

  // neighbor box
  var first_i: i32;
  var pointer: i32;
  var first_j: i32;

  // common
  var r2: f64;
  var u2: f64;
  var fs: f64;
  var vij: f64;
  var fxij: f64;
  var fyij: f64;
  var fzij: f64;

  //  INPUTS
  alpha = par.alpha;
  a2 = 2.0 * alpha * alpha;
  // PROCESS INTERACTIONS

  for (l = 0; l < dim.number_boxes; l = l + 1) {
    // home box - box parameters
    first_i = <i32>box[l].offset;

    //  Do for the # of (home+neighbor) boxes
    for (k = 0; k < 1 + box[l].nn; k++) {
      //  neighbor box - get pointer to the right box
      if (k == 0) {
        pointer = l; // set first box to be processed to home box
      } else {
        pointer = <i32>box[l].nei[k - 1].number; // remaining boxes are neighbor boxes
      }

      first_j = <i32>box[pointer].offset;

      for (i = 0; i < NUMBER_PAR_PER_BOX; i = i + 1) {
        for (j = 0; j < NUMBER_PAR_PER_BOX; j = j + 1) {
          r2 =
            rv[first_i + i].v +
            rv[first_j + j].v -
            DOT(rv[first_i + i], rv[first_j + j]);
          u2 = a2 * r2;
          vij = Math.exp(-u2);
          fs = 2 * vij;
          var dx = rv[first_i + i].x - rv[first_j + j].x;
          var dy = rv[first_i + i].y - rv[first_j + j].y;
          var dz = rv[first_i + i].z - rv[first_j + j].z;
          fxij = fs * dx;
          fyij = fs * dy;
          fzij = fs * dz;

          // forces
          fv[first_i + i].v += qv[first_j + j] * vij;
          fv[first_i + i].x += qv[first_j + j] * fxij;
          fv[first_i + i].y += qv[first_j + j] * fyij;
          fv[first_i + i].z += qv[first_j + j] * fzij;
        }
      }
    }
  }
}

export function main(boxes1d: i32): void {
  lavamd(boxes1d);
}
