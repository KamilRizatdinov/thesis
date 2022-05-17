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

function squash(x: f64): f64 {
  return 1.0 / (1.0 + Math.exp(-x));
}

class Net {
  input_n: i32;
  hidden_n: i32;
  output_n: i32;
  input_units: StaticArray<f64>;
  hidden_units: StaticArray<f64>;
  output_units: StaticArray<f64>;

  hidden_delta: StaticArray<f64>;
  output_delta: StaticArray<f64>;
  target: StaticArray<f64>;

  input_weights: StaticArray<f64>; // TA
  hidden_weights: StaticArray<f64>; // TA

  input_prev_weights: StaticArray<f64>;
  hidden_prev_weights: StaticArray<f64>; // TA

  constructor(n_in: i32, n_hidden: i32, n_out: i32) {
    this.input_n = n_in;
    this.hidden_n = n_hidden;
    this.output_n = n_out;
    this.input_units = new StaticArray<f64>(n_in + 1);
    this.hidden_units = new StaticArray<f64>(n_hidden + 1);
    this.output_units = new StaticArray<f64>(n_out + 1);

    this.hidden_delta = new StaticArray<f64>(n_hidden + 1);
    this.output_delta = new StaticArray<f64>(n_out + 1);
    this.target = new StaticArray<f64>(n_out + 1);

    this.input_weights = new StaticArray<f64>((n_in + 1) * (n_hidden + 1)); // TA
    this.hidden_weights = new StaticArray<f64>((n_hidden + 1) * (1 + n_out)); // TA

    this.input_prev_weights = new StaticArray<f64>((n_in + 1) * (1 + n_hidden));
    this.hidden_prev_weights = new StaticArray<f64>(
      (n_hidden + 1) * (1 + n_out),
    ); // TA
  }
}

function bpnn_randomize_array(w: StaticArray<f64>, m: i32, n: i32): void {
  var i = 0,
    l = (m + 1) * (n + 1);

  for (i = 0; i < l; i++) {
    unchecked((w[i] = commonRandomJS()));
  }
}

function loadInput(w: StaticArray<f64>, m: i32, n: i32): void {
  var i = 1,
    l = (m + 1) * n;

  for (i = 1; i < l; i++) {
    unchecked((w[i] = commonRandomJS()));
  }
}

function bpnn_randomize_row(w: StaticArray<f64>, m: i32): void {
  for (var i = 0; i <= m; i++) {
    unchecked((w[i] = 0.1));
  }
}

function bpnn_create(n_in: i32, n_hidden: i32, n_out: i32): Net {
  var newnet = new Net(n_in, n_hidden, n_out);

  bpnn_randomize_array(newnet.input_weights, n_in, n_hidden);
  bpnn_randomize_array(newnet.hidden_weights, n_hidden, n_out);
  bpnn_randomize_row(newnet.target, n_out);

  // Load input image with random values
  loadInput(newnet.input_units, n_in, 1);

  return newnet;
}

function bpnn_train_kernel(net: Net): void {
  var inp: i32;
  var hid: i32;
  var out: i32;
  var out_err: f64;
  var hid_err: f64;

  inp = net.input_n;
  hid = net.hidden_n;
  out = net.output_n;

  bpnn_layerforward(
    net.input_units,
    net.hidden_units,
    net.input_weights,
    inp,
    hid,
  );
  bpnn_layerforward(
    net.hidden_units,
    net.output_units,
    net.hidden_weights,
    hid,
    out,
  );

  out_err = bpnn_output_error(
    net.output_delta,
    net.target,
    net.output_units,
    out,
  );
  hid_err = bpnn_hidden_error(
    net.hidden_delta,
    hid,
    net.output_delta,
    out,
    net.hidden_weights,
    net.hidden_units,
  );

  bpnn_adjust_weights(
    net.output_delta,
    out,
    net.hidden_units,
    hid,
    net.hidden_weights,
    net.hidden_prev_weights,
  );
  bpnn_adjust_weights(
    net.hidden_delta,
    hid,
    net.input_units,
    inp,
    net.input_weights,
    net.input_prev_weights,
  );
}

function bpnn_layerforward(
  l1: StaticArray<f64>,
  l2: StaticArray<f64>,
  conn: StaticArray<f64>,
  n1: i32,
  n2: i32,
): void {
  var sum: f64;
  var j: i32;
  var k: i32;
  var nc: i32 = n2 + 1;
  var nr: i32 = n1 + 1;

  /*** Set up thresholding unit ***/
  unchecked((l1[0] = 1.0));
  /*** For each unit in second layer ***/
  for (j = 1; j < nc; j++) {
    /*** Compute weighted sum of its inputs ***/
    sum = 0.0;
    for (k = 0; k < nr; k++) {
      sum += unchecked(conn[k * nc + j] * l1[k]);
    }
    unchecked((l2[j] = squash(sum)));
  }
}

//extern "C"
function bpnn_output_error(
  delta: StaticArray<f64>,
  target: StaticArray<f64>,
  output: StaticArray<f64>,
  nj: i32,
): f64 {
  var o: f64;
  var t: f64;
  var errsum: f64 = 0.0;

  for (var j = 1; j <= nj; j++) {
    o = unchecked(output[j]);
    t = unchecked(target[j]);
    unchecked((delta[j] = o * (1.0 - o) * (t - o)));
    errsum += Math.abs(unchecked(delta[j]));
  }
  return errsum;
}

function bpnn_hidden_error(
  delta_h: StaticArray<f64>,
  nh: i32,
  delta_o: StaticArray<f64>,
  no: i32,
  who: StaticArray<f64>,
  hidden: StaticArray<f64>,
): f64 {
  var j: i32;
  var k: i32;
  var h: f64;
  var sum: f64;
  var errsum: f64 = 0.0;
  var nr: i32 = nh + 1;
  var nc: i32 = no + 1;

  for (j = 1; j < nr; j++) {
    h = unchecked(hidden[j]);
    sum = 0.0;
    for (k = 1; k < nc; k++) {
      sum += unchecked(delta_o[k] * who[j * no + k]);
    }
    unchecked((delta_h[j] = h * (1.0 - h) * sum));
    errsum += Math.abs(unchecked(delta_h[j]));
  }
  return errsum;
}

function bpnn_adjust_weights(
  delta: StaticArray<f64>,
  ndelta: i32,
  ly: StaticArray<f64>,
  nly: i32,
  w: StaticArray<f64>,
  oldw: StaticArray<f64>,
): void {
  var new_dw: f64;
  var k: i32;
  var j: i32;
  var nr: i32 = nly + 1;
  var nc: i32 = ndelta + 1;

  unchecked((ly[0] = 1.0));
  for (j = 1; j < nc; j++) {
    for (k = 0; k < nr; k++) {
      new_dw = unchecked(ETA * delta[j] * ly[k] + MOMENTUM * oldw[k * nc + j]);
      unchecked((w[k * nc + j] += new_dw));
      unchecked((oldw[k * nc + j] = new_dw));
    }
  }
}

//var layer_size = 0;
var ETA = 0.3; //eta value
var MOMENTUM = 0.3; //momentum value

function backprop_face(layer_size: i32): void {
  var net: Net = bpnn_create(layer_size, 16, 1); // (16, 1 can not be changed)
  //entering the training kernel, only one iteration
  if (net) bpnn_train_kernel(net);

  // console.log(
  //   `${net.input_n.toString()} ${net.hidden_n.toString()} ${net.output_n.toString()}`,
  // );
  // console.log(net.input_units.join(' '));
  // console.log(net.hidden_units.join(' '));
  // console.log(net.output_units.join(' '));
  // console.log(net.hidden_delta.join(' '));
  // console.log(net.output_delta.join(' '));
  // console.log(net.target.join(' '));
  // console.log(net.input_weights.join(' '));
  // console.log(net.hidden_weights.join(' '));
  // console.log(net.input_prev_weights.join(' '));
  // console.log(net.hidden_prev_weights.join(' '));
}

export function main(nb_input_elems: i32): void {
  backprop_face(nb_input_elems);
}
