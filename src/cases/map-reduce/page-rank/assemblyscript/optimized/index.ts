var d_factor: f64 = 0.85; //damping factor

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

// generates an array of random pages and their links
function random_pages(
  n: i32,
  noutlinks: StaticArray<i32>,
  divisor: i32,
): StaticArray<i32> {
  var i: i32;
  var j: i32;
  var k: i32;
  var pages = new StaticArray<i32>(n * n); // matrix cell i,j means link from j->i

  for (i = 0; i < n; ++i) {
    unchecked((noutlinks[i] = 0));
    for (j = 0; j < n; ++j) {
      if (i != j && Math.abs(commonRandom()) % divisor === 0) {
        unchecked((pages[i * n + j] = 1));
        unchecked((noutlinks[i] += 1));
      }
    }

    // the case with no outlinks is afunctioned
    if (unchecked(noutlinks[i]) == 0) {
      do {
        k = <i32>(Math.abs(commonRandom()) % n);
      } while (k == i);
      unchecked((pages[i * n + k] = 1));
      unchecked((noutlinks[i] = 1));
    }
  }
  return pages;
}

function init_array(a: StaticArray<f64>, n: i32, val: f64): void {
  var i: i32;
  for (i = 0; i < n; ++i) {
    unchecked((a[i] = val));
  }
}

function map_page_rank(
  pages: StaticArray<i32>,
  page_ranks: StaticArray<f64>,
  maps: StaticArray<f64>,
  noutlinks: StaticArray<i32>,
  n: i32,
): void {
  var i: i32;
  var j: i32;
  for (i = 0; i < n; ++i) {
    var outbound_rank = unchecked(page_ranks[i] / noutlinks[i]);
    for (j = 0; j < n; ++j) {
      unchecked(
        (maps[i * n + j] =
          pages[i * n + j] === 0 ? 0 : pages[i * n + j] * outbound_rank),
      );
    }
  }
}

function reduce_page_rank(
  page_ranks: StaticArray<f64>,
  maps: StaticArray<f64>,
  n: i32,
): f64 {
  var i: i32;
  var j: i32;
  var dif: f64 = 0.0;
  var new_rank: f64;
  var old_rank: f64;

  for (j = 0; j < n; ++j) {
    old_rank = unchecked(page_ranks[j]);
    new_rank = 0.0;
    for (i = 0; i < n; ++i) {
      new_rank += unchecked(maps[i * n + j]);
    }

    new_rank = (1 - d_factor) / n + d_factor * new_rank;
    dif =
      Math.abs(new_rank - old_rank) > dif ? Math.abs(new_rank - old_rank) : dif;
    unchecked((page_ranks[j] = new_rank));
  }
  return dif;
}

export function main(n: i32, iter: i32, thresh: f64, divisor: i32): void {
  var pages: StaticArray<i32>;
  var page_ranks: StaticArray<f64>;
  var maps: StaticArray<f64>;
  var noutlinks: StaticArray<i32>;
  var t: i32;
  var max_diff: f64 = f64.MAX_VALUE;

  page_ranks = new StaticArray<f64>(n);
  maps = new StaticArray<f64>(n * n);
  noutlinks = new StaticArray<i32>(n);

  pages = random_pages(n, noutlinks, divisor);
  init_array(page_ranks, n, 1.0 / n);

  for (t = 1; t <= iter && max_diff >= thresh; ++t) {
    map_page_rank(pages, page_ranks, maps, noutlinks, n);
    max_diff = reduce_page_rank(page_ranks, maps, n);
  }

  // console.log(max_diff.toString());
}
