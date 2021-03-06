var T: i32 = 1000; /* Number of static observations */
var S: i32 = 2; /* Number of static symbols */
var N: i32 = 60; /* Number of static states */
var ITERATIONS: i32 = 1; /* Number of iterations */
var EXIT_ERROR: f32 = 1;

// /* Global variables for device */
var nstates: i32; /* The number of states in the HMM */
var nsymbols: i32; /* The number of possible symbols */
var obs: StaticArray<i32>; /* The observation sequence */
var length: i32; /* The length of the observation sequence */
var scale: StaticArray<f32>; /* Scaling factor as determined by alpha */

var alpha: StaticArray<f32>;
var beta: StaticArray<f32>;
var ones_n: StaticArray<f32>;
var ones_s: StaticArray<f32>;
var gamma_sum: StaticArray<f32>;
var xi_sum: StaticArray<f32>;
var c: StaticArray<f32>;

/**
 * Calculates the dot product of two vectors.
 * Both vectors must be atleast of length n
 */
function dot_product(
  n: i32,
  x: StaticArray<f32>,
  offsetx: i32,
  y: StaticArray<f32>,
  offsety: i32,
): f32 {
  var result: f32 = 0.0;
  var i = 0;
  if (!x || !y || n == 0) return result;
  for (i = 0; i < n; ++i) result += unchecked(x[i + offsetx] * y[i + offsety]);
  return result;
}

function mat_vec_mul(
  trans: string,
  m: i32,
  n: i32,
  a: StaticArray<f32>,
  lda: i32,
  x: StaticArray<f32>,
  offsetx: i32,
  y: StaticArray<f32>,
  offsety: i32,
): void {
  if (trans != 'n' && trans != 't') {
    return;
  }

  var i: i32;
  var j: i32;
  var n_size: i32;
  var m_size: i32;
  var sum: f32;
  if (lda == m) {
    n_size = n;
    m_size = m;
  } else {
    n_size = m;
    m_size = n;
  }
  if (trans == 'n') {
    for (i = 0; i < m_size; ++i) {
      sum = 0.0;
      for (j = 0; j < n_size; ++j) {
        sum += unchecked(a[i * n_size + j] * x[offsetx + j]);
      }
      unchecked((y[i + offsety] = sum));
    }
  } else {
    for (i = 0; i < m_size; ++i) {
      sum = 0.0;
      for (j = 0; j < n_size; ++j) {
        sum += unchecked(a[j * n_size + i] * x[offsetx + j]);
      }
      unchecked((y[i + offsety] = sum));
    }
  }
}

function init_ones_dev(ones: StaticArray<f32>, nsymbols: i32): void {
  var i: i32;
  for (i = 0; i < nsymbols; ++i) unchecked((ones[i] = 1.0));
}

/*******************************************************************************
 * Supporting functions
 */
function init_alpha(
  b_d: StaticArray<f32>,
  pi_d: StaticArray<f32>,
  nstates: i32,
  alpha_d: StaticArray<f32>,
  ones_n_d: StaticArray<f32>,
  obs_t: i32,
): void {
  var i: i32;
  for (i = 0; i < nstates; ++i) {
    unchecked((alpha_d[i] = pi_d[i] * b_d[obs_t * nstates + i]));
    unchecked((ones_n_d[i] = 1.0));
  }
}

function scale_alpha_values(
  nstates: i32,
  alpha_d: StaticArray<f32>,
  offset: i32,
  scale: f32,
): void {
  var i: i32;
  for (i = 0; i < nstates; ++i)
    unchecked((alpha_d[offset + i] = alpha_d[offset + i] / scale));
}

function calc_alpha_dev(
  nstates: i32,
  alpha_d: StaticArray<f32>,
  offset: i32,
  b_d: StaticArray<f32>,
  obs_t: i32,
): void {
  var i = 0;
  for (i = 0; i < nstates; ++i) {
    unchecked(
      (alpha_d[offset + i] = alpha_d[offset + i] * b_d[obs_t * nstates + i]),
    );
  }
}

function log10(val: f32): f32 {
  return <f32>(Math.log(val) / Math.LN10);
}

/* Calculates the forward variables (alpha) for an HMM and obs. sequence */
function calc_alpha(
  a: StaticArray<f32>,
  b: StaticArray<f32>,
  pi: StaticArray<f32>,
): f32 {
  var log_lik: f32;
  var t: i32;
  var offset_cur: i32;
  var offset_prev: i32;

  // initialize alpha variables
  init_alpha(b, pi, nstates, alpha, ones_n, unchecked(obs[0]));

  /* Sum alpha values to get scaling factor */
  unchecked((scale[0] = dot_product(nstates, alpha, 0, ones_n, 0)));

  // Scale the alpha values
  scale_alpha_values(nstates, alpha, 0, scale[0]);

  /* Initilialize log likelihood */
  log_lik = log10(unchecked(scale[0]));

  /* Calculate the rest of the alpha variables */
  for (t = 1; t < length; t++) {
    /* Calculate offsets */
    offset_prev = (t - 1) * nstates;
    offset_cur = t * nstates;

    /* Multiply transposed A matrix by alpha(t-1) */
    /* Note: the matrix is auto-transposed by cublas reading column-major */
    // mat_vec_mul( 'N', nstates, nstates, 1.0f, a_d, nstates,
    //              alpha_d + offset_prev, 1, 0, alpha_d + offset_cur, 1 );
    mat_vec_mul(
      'n',
      nstates,
      nstates,
      a,
      nstates,
      alpha,
      offset_prev,
      alpha,
      offset_cur,
    );

    calc_alpha_dev(nstates, alpha, offset_cur, b, unchecked(obs[t]));

    /* Sum alpha values to get scaling factor */
    unchecked((scale[t] = dot_product(nstates, alpha, offset_cur, ones_n, 0)));

    // scale alpha values
    scale_alpha_values(nstates, alpha, offset_cur, unchecked(scale[t]));

    log_lik += log10(unchecked(scale[t]));
  }
  return log_lik;
}

function init_beta_dev(
  nstates: i32,
  beta_d: StaticArray<f32>,
  offset: i32,
  scale: f32,
): void {
  var i: i32;
  for (i = 0; i < nstates; ++i) {
    unchecked((beta_d[offset + i] = 1.0 / scale));
  }
}

function calc_beta_dev(
  beta_d: StaticArray<f32>,
  b_d: StaticArray<f32>,
  scale_t: f32,
  nstates: i32,
  obs_t: i32,
  t: i32,
): void {
  var i: i32;
  for (i = 0; i < nstates; ++i) {
    unchecked(
      (beta_d[t * nstates + i] =
        (beta_d[(t + 1) * nstates + i] * b_d[obs_t * nstates + i]) / scale_t),
    );
  }
}

/* Calculates the backward variables (beta) */
function calc_beta(a: StaticArray<f32>, b: StaticArray<f32>): f32 {
  /* Initialize beta variables */
  var offset: i32 = (length - 1) * nstates;
  var t: i32;
  init_beta_dev(nstates, beta, offset, unchecked(scale[length - 1]));
  /* Calculate the rest of the beta variables */
  for (t = length - 2; t >= 0; t--) {
    calc_beta_dev(
      beta,
      b,
      unchecked(scale[t]),
      nstates,
      unchecked(obs[t + 1]),
      t,
    );

    mat_vec_mul(
      'n',
      nstates,
      nstates,
      a,
      nstates,
      beta,
      t * nstates,
      beta,
      t * nstates,
    );
  }
  return 0;
}

function calc_gamma_dev(
  gamma_sum_d: StaticArray<f32>,
  alpha_d: StaticArray<f32>,
  beta_d: StaticArray<f32>,
  nstates: i32,
  t: i32,
): void {
  var i: i32;
  for (i = 0; i < nstates; ++i) {
    unchecked(
      (gamma_sum_d[i] += alpha_d[t * nstates + i] * beta_d[t * nstates + i]),
    );
  }
}

/* Calculates the gamma sum */
function calc_gamma_sum(): void {
  var t: i32;

  for (t = 0; t < nstates; ++t) unchecked((gamma_sum[t] = 0.0));
  /* Find sum of gamma variables */
  for (t = 0; t < length; t++) {
    calc_gamma_dev(gamma_sum, alpha, beta, nstates, t);
  }
}

function calc_xi_sum_dev(
  xi_sum_d: StaticArray<f32>,
  a_d: StaticArray<f32>,
  b_d: StaticArray<f32>,
  alpha_d: StaticArray<f32>,
  beta_d: StaticArray<f32>,
  sum_ab: f32,
  nstates: i32,
  obs_t: i32,
  t: i32,
): void {
  var i: i32;
  var j: i32;
  for (i = 0; i < nstates; ++i) {
    for (j = 0; j < nstates; ++j) {
      unchecked(
        (xi_sum_d[j * nstates + i] +=
          (alpha_d[t * nstates + j] *
            a_d[j * nstates + i] *
            b_d[obs_t * nstates + i] *
            beta_d[(t + 1) * nstates + i]) /
          sum_ab),
      );
    }
  }
}

/* Calculates the sum of xi variables */
function calc_xi_sum(a: StaticArray<f32>, b: StaticArray<f32>): f32 {
  var sum_ab: f32;
  var t: i32;

  for (t = 0; t < nstates; ++t) unchecked((xi_sum[t] = 0));
  /* Find the sum of xi variables */
  for (t = 0; t < length - 1; t++) {
    /* Calculate denominator */
    sum_ab = dot_product(nstates, alpha, t * nstates, beta, t * nstates);
    calc_xi_sum_dev(
      xi_sum,
      a,
      b,
      alpha,
      beta,
      sum_ab,
      nstates,
      unchecked(obs[t + 1]),
      t,
    );
  }
  return 0;
}

function est_a_dev(
  a_d: StaticArray<f32>,
  alpha_d: StaticArray<f32>,
  beta_d: StaticArray<f32>,
  xi_sum_d: StaticArray<f32>,
  gamma_sum_d: StaticArray<f32>,
  sum_ab: f32,
  nstates: i32,
  length: i32,
): void {
  var i: i32;
  var j: i32;
  for (i = 0; i < nstates; ++i) {
    for (j = 0; j < nstates; ++j) {
      unchecked(
        (a_d[j * nstates + i] =
          xi_sum_d[j * nstates + i] /
          (gamma_sum_d[j] -
            (alpha_d[j * nstates + i] * beta_d[j * nstates + i]) / sum_ab)),
      );
    }
  }
}

function scale_a_dev(
  a_d: StaticArray<f32>,
  c_d: StaticArray<f32>,
  nstates: i32,
): void {
  var i: i32;
  var j: i32;
  for (i = 0; i < nstates; ++i) {
    for (j = 0; j < nstates; ++j) {
      unchecked((a_d[j * nstates + i] = a_d[j * nstates + i] / c_d[j]));
    }
  }
}
/* Re-estimates the state transition probabilities (A) */
function estimate_a(a: StaticArray<f32>): f32 {
  var sum_ab: f32 = dot_product(
    nstates,
    alpha,
    (length - 1) * nstates,
    beta,
    (length - 1) * nstates,
  );
  est_a_dev(a, alpha, beta, xi_sum, gamma_sum, sum_ab, nstates, length);

  /* Sum rows of A to get scaling values */
  // mat_vec_mul( 'T', nstates, nstates, 1.0f, a_d, nstates,
  // ones_n_d, 1, 0, c_d, 1 );
  mat_vec_mul('t', nstates, nstates, a, nstates, ones_n, 0, c, 0);

  /* Normalize A matrix */
  // scale_a_dev<<<grid, threads>>>( a_d,
  // c_d,
  // nstates);
  scale_a_dev(a, c, nstates);

  return 0;
}

/* Accumulate B values */
function acc_b_dev(
  b_d: StaticArray<f32>,
  alpha_d: StaticArray<f32>,
  beta_d: StaticArray<f32>,
  sum_ab: f32,
  nstates: i32,
  nsymbols: i32,
  obs_t: i32,
  t: i32,
): void {
  var i: i32;
  var j: i32;
  for (i = 0; i < nstates; ++i) {
    for (j = 0; j < nsymbols; ++j) {
      if (j == obs_t) {
        unchecked(
          (b_d[j * nstates + i] +=
            (alpha_d[t * nstates + i] * beta_d[t * nstates + i]) / sum_ab),
        );
      }
    }
  }
}

/* Re-estimate B values */
function est_b_dev(
  b_d: StaticArray<f32>,
  gamma_sum_d: StaticArray<f32>,
  nstates: i32,
  nsymbols: i32,
): void {
  var i: i32;
  var j: i32;
  for (i = 0; i < nstates; ++i) {
    for (j = 0; j < nsymbols; ++j) {
      unchecked((b_d[j * nstates + i] = b_d[j * nstates + i] / gamma_sum_d[i]));
    }
  }
}

/* Normalize B matrix */
function scale_b_dev(
  b_d: StaticArray<f32>,
  c_d: StaticArray<f32>,
  nstates: i32,
  nsymbols: i32,
): void {
  var i: i32;
  var j: i32;
  for (i = 0; i < nstates; ++i) {
    for (j = 0; j < nsymbols; ++j) {
      if (unchecked(Math.abs(b_d[i * nsymbols + j])) < 0.000001) {
        unchecked((b_d[i * nsymbols + j] = 1e-10));
      } else {
        unchecked((b_d[i * nsymbols + j] = b_d[i * nsymbols + j] / c_d[i]));
      }
    }
  }
}

/* Re-estimates the output symbol probabilities (B) */
function estimate_b(b: StaticArray<f32>): f32 {
  var sum_ab: f32;
  var t: i32;

  for (t = 0; t < nstates * nsymbols; ++t) unchecked((b[t] = 0.0));

  for (t = 0; t < length - 1; t++) {
    /* Calculate denominator */
    sum_ab = dot_product(nstates, alpha, t * nstates, beta, t * nstates);
    acc_b_dev(
      b,
      alpha,
      beta,
      sum_ab,
      nstates,
      nsymbols,
      unchecked(obs[t + 1]),
      t,
    );
  }

  /* Re-estimate B values */
  est_b_dev(b, gamma_sum, nstates, nsymbols);

  /* Sum rows of B to get scaling values */
  // mat_vec_mul( 'N', nstates, nsymbols, 1.0f, b_d, nstates,
  // ones_s_d, 1, 0, c_d, 1 );
  for (t = 0; t < nstates; ++t) unchecked((c[t] = 0.0));
  mat_vec_mul('n', nstates, nsymbols, b, nstates, ones_s, 0, c, 0);
  /* Normalize B matrix */
  scale_b_dev(b, c, nstates, nsymbols);
  return 0;
}

function est_pi_dev(
  pi_d: StaticArray<f32>,
  alpha_d: StaticArray<f32>,
  beta_d: StaticArray<f32>,
  sum_ab: f32,
  nstates: i32,
): void {
  var i: i32;
  for (i = 0; i < nstates; ++i) {
    unchecked((pi_d[i] = (alpha_d[i] * beta_d[i]) / sum_ab));
  }
}

/* Re-estimates the initial state probabilities (Pi) */
function estimate_pi(pi: StaticArray<f32>): f32 {
  var sum_ab: f32 = dot_product(nstates, alpha, 0, beta, 0);

  /* Estimate Pi values */
  est_pi_dev(pi, alpha, beta, sum_ab, nstates);

  return 0;
}

// /* Runs the Baum-Welch Algorithm on the supplied HMM and observation sequence */
function run_hmm_bwa(
  hmm: HMM,
  in_obs: OBS,
  iterations: i32,
  threshold: i32,
): f32 {
  /* Host-side variables */
  var a: StaticArray<f32>;
  var b: StaticArray<f32>;
  var pi: StaticArray<f32>;
  var new_log_lik: f32 = 0;
  var old_log_lik: f32 = 0;
  var iter: i32;

  /* Initialize HMM values */
  a = hmm.a;
  b = hmm.b;
  pi = hmm.pi;
  nsymbols = hmm.nsymbols;
  nstates = hmm.nstates;
  obs = in_obs.data;
  length = in_obs.length;

  /* Allocate host memory */
  scale = new StaticArray<f32>(length);

  alpha = new StaticArray<f32>(nstates * length);
  beta = new StaticArray<f32>(nstates * length);
  gamma_sum = new StaticArray<f32>(nstates);
  xi_sum = new StaticArray<f32>(nstates * nstates);
  c = new StaticArray<f32>(nstates);
  ones_n = new StaticArray<f32>(nstates);
  ones_s = new StaticArray<f32>(nsymbols);

  init_ones_dev(ones_s, nsymbols);

  /* Run BWA for either max iterations or until threshold is reached */
  for (iter = 0; iter < iterations; iter++) {
    new_log_lik = calc_alpha(a, b, pi);
    if (new_log_lik == EXIT_ERROR) {
      return EXIT_ERROR;
    }
    if (calc_beta(a, b) == EXIT_ERROR) {
      return EXIT_ERROR;
    }

    calc_gamma_sum();

    if (calc_xi_sum(a, b) == EXIT_ERROR) {
      return EXIT_ERROR;
    }

    if (estimate_a(a) == EXIT_ERROR) {
      return EXIT_ERROR;
    }

    if (estimate_b(b) == EXIT_ERROR) {
      return EXIT_ERROR;
    }

    if (estimate_pi(pi) == EXIT_ERROR) {
      return EXIT_ERROR;
    }

    /* check log_lik vs. threshold */
    if (threshold > 0 && iter > 0) {
      if (
        Math.abs(Math.pow(10, new_log_lik) - Math.pow(10, old_log_lik)) <
        threshold
      ) {
        break;
      }
    }

    old_log_lik = new_log_lik;
  }
  return new_log_lik;
}

class HMM {
  nstates: i32;
  nsymbols: i32;
  a: StaticArray<f32>;
  b: StaticArray<f32>;
  pi: StaticArray<f32>;

  constructor(
    nstates: i32,
    nsymbols: i32,
    a: StaticArray<f32>,
    b: StaticArray<f32>,
    pi: StaticArray<f32>,
  ) {
    this.nstates = nstates;
    this.nsymbols = nsymbols;
    this.a = a;
    this.b = b;
    this.pi = pi;
  }
}

class OBS {
  length: i32;
  data: StaticArray<i32>;

  constructor(length: i32, data: StaticArray<i32>) {
    this.length = length;
    this.data = data;
  }
}

/* Time the forward algorithm and vary the number of states */
export function main(v_: string, n_: i32, s_: i32, t_: i32): void {
  /* Initialize variables */
  var hmm: HMM;
  var obs: OBS; /* Observation sequence */
  var a: StaticArray<f32>;
  var b: StaticArray<f32>;
  var pi: StaticArray<f32>;
  var obs_seq: StaticArray<i32>;
  var s = s_ || S,
    t = t_ || T;
  var n = n_ || N;
  var v_model = v_;
  var i: i32;

  if (v_model == 'n') {
    /* Create observation sequence */
    obs_seq = new StaticArray<i32>(T);
    for (i = 0; i < T; i++) {
      unchecked((obs_seq[i] = 0));
    }

    obs = new OBS(T, obs_seq);

    a = new StaticArray<f32>(n * n);
    for (i = 0; i < n * n; i++) {
      unchecked((a[i] = 1.0 / <f32>n));
    }

    b = new StaticArray<f32>(n * s);
    for (i = 0; i < n * S; i++) {
      unchecked((b[i] = 1.0 / <f32>S));
    }

    pi = new StaticArray<f32>(n);
    for (i = 0; i < n; i++) {
      unchecked((pi[i] = 1.0 / <f32>n));
    }

    hmm = new HMM(n, S, a, b, pi);

    /* Run the BWA on the observation sequence */

    var log_lik = run_hmm_bwa(hmm, obs, ITERATIONS, 0);
    // console.log(log_lik.toString());
  } else if (v_model == 's') {
    /* Create observation sequence */
    obs_seq = new StaticArray<i32>(T);
    for (i = 0; i < T; i++) {
      unchecked((obs_seq[i] = 0));
    }
    obs = new OBS(T, obs_seq);

    a = new StaticArray<f32>(N * N);
    for (i = 0; i < N * N; i++) {
      unchecked((a[i] = 1.0 / <f32>N));
    }

    b = new StaticArray<f32>(N * s);
    for (i = 0; i < N * s; i++) {
      unchecked((b[i] = 1.0 / <f32>s));
    }

    pi = new StaticArray<f32>(N);
    for (i = 0; i < N; i++) {
      unchecked((pi[i] = 1.0 / <f32>N));
    }

    hmm = new HMM(N, s, a, b, pi);

    /* Run the BWA on the observation sequence */
    log_lik = run_hmm_bwa(hmm, obs, ITERATIONS, 0);
  } else if (v_model == 't') {
    a = new StaticArray<f32>(N * N);
    for (i = 0; i < N * N; i++) {
      unchecked((a[i] = 1.0 / <f32>N));
    }

    b = new StaticArray<f32>(N * S);
    for (i = 0; i < N * S; i++) {
      unchecked((b[i] = 1.0 / <f32>S));
    }

    pi = new StaticArray<f32>(N);
    for (i = 0; i < N; i++) {
      unchecked((pi[i] = 1.0 / <f32>N));
    }

    hmm = new HMM(N, S, a, b, pi);

    /* Create observation sequence */
    obs_seq = new StaticArray<i32>(t);
    for (i = 0; i < t; i++) {
      unchecked((obs_seq[i] = 0));
    }
    obs = new OBS(t, obs_seq);

    /* Run the BWA on the observation sequence */
    log_lik = run_hmm_bwa(hmm, obs, ITERATIONS, 0);
  }
}
