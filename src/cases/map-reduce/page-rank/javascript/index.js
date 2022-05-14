var d_factor = 0.85; //damping factor

Math.commonRandom = (function () {
  var seed = 49734321;
  return function () {
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

Math.commonRandomJS = function () {
  return Math.abs(Math.commonRandom() / 0x7fffffff);
};

// generates an array of random pages and their links
function random_pages(n, noutlinks, divisor) {
  var i, j, k;
  var pages = new Int32Array(n * n); // matrix cell i,j means link from j->i

  for (i = 0; i < n; ++i) {
    noutlinks[i] = 0;
    for (j = 0; j < n; ++j) {
      if (i != j && Math.abs(Math.commonRandom()) % divisor === 0) {
        pages[i * n + j] = 1;
        noutlinks[i] += 1;
      }
    }

    // the case with no outlinks is afunctioned
    if (noutlinks[i] == 0) {
      do {
        k = Math.abs(Math.commonRandom()) % n;
      } while (k == i);
      pages[i * n + k] = 1;
      noutlinks[i] = 1;
    }
  }
  return pages;
}

function init_array(a, n, val) {
  var i;
  for (i = 0; i < n; ++i) {
    a[i] = val;
  }
}

function map_page_rank(pages, page_ranks, maps, noutlinks, n) {
  var i, j;
  for (i = 0; i < n; ++i) {
    var outbound_rank = page_ranks[i] / noutlinks[i];
    for (j = 0; j < n; ++j) {
      maps[i * n + j] =
        pages[i * n + j] === 0 ? 0 : pages[i * n + j] * outbound_rank;
    }
  }
}

function reduce_page_rank(page_ranks, maps, n) {
  var i, j;
  var dif = 0.0;
  var new_rank, old_rank;

  for (j = 0; j < n; ++j) {
    old_rank = page_ranks[j];
    new_rank = 0.0;
    for (i = 0; i < n; ++i) {
      new_rank += maps[i * n + j];
    }

    new_rank = (1 - d_factor) / n + d_factor * new_rank;
    dif =
      Math.abs(new_rank - old_rank) > dif ? Math.abs(new_rank - old_rank) : dif;
    page_ranks[j] = new_rank;
  }
  return dif;
}

export function main(n, iter, thresh, divisor) {
  var n = n !== undefined ? n : 1000;
  var iter = iter !== undefined ? iter : 1000;
  var thresh = thresh !== undefined ? thresh : 0.00001;
  var divisor = divisor !== undefined ? divisor : 2;
  var pages;
  var maps;
  var page_ranks;
  var noutlinks;
  var t;
  var max_diff = Infinity;

  page_ranks = new Float64Array(n);
  maps = new Float64Array(n * n);
  noutlinks = new Int32Array(n);

  pages = random_pages(n, noutlinks, divisor);
  init_array(page_ranks, n, 1.0 / n);

  for (t = 1; t <= iter && max_diff >= thresh; ++t) {
    map_page_rank(pages, page_ranks, maps, noutlinks, n);
    max_diff = reduce_page_rank(page_ranks, maps, n);
  }
}
