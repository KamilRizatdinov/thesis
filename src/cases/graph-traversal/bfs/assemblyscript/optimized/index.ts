var MIN_EDGES = 2;
var MAX_INIT_EDGES = 4;
var MIN_WEIGHT = 1;
var MAX_WEIGHT = 1;

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

class Node {
  starting: i32;
  no_of_edges: i32;
  constructor(starting: i32, no_of_edges: i32) {
    this.starting = starting;
    this.no_of_edges = no_of_edges;
  }
  toString(): string {
    return `starting: ${this.starting}, no_of_edges: ${this.no_of_edges}`;
  }
}

class Edge {
  dest: i32;
  weight: i32;
}

class Graph {
  h_graph_nodes: StaticArray<Node>;
  h_graph_mask: StaticArray<bool>;
  h_updating_graph_mask: StaticArray<bool>;
  h_graph_visited: StaticArray<bool>;
  h_cost: StaticArray<i32>;
  h_graph_edges: StaticArray<i32>;
}

function edge(dest: i32, weight: i32): Edge {
  return {
    dest: dest,
    weight: weight,
  };
}

export function main(no_of_nodes: i32): void {
  var inits = InitializeGraph(no_of_nodes);
  var h_graph_nodes = inits.h_graph_nodes;
  var h_graph_mask = inits.h_graph_mask;
  var h_updating_graph_mask = inits.h_updating_graph_mask;
  var h_graph_visited = inits.h_graph_visited;
  var h_cost = inits.h_cost;
  var h_graph_edges = inits.h_graph_edges;

  var k = 0;
  var stop: bool;
  var tid: i32;
  var i: i32;

  do {
    stop = false;

    for (tid = 0; tid < no_of_nodes; ++tid) {
      if (unchecked(h_graph_mask[tid])) {
        unchecked((h_graph_mask[tid] = false));
        for (
          i = unchecked(h_graph_nodes[tid]).starting;
          i <
          unchecked(h_graph_nodes[tid]).no_of_edges +
            unchecked(h_graph_nodes[tid]).starting;
          ++i
        ) {
          var id = unchecked(h_graph_edges[i]);
          if (!h_graph_visited[id]) {
            unchecked((h_cost[id] = h_cost[tid] + 1));
            unchecked((h_updating_graph_mask[id] = true));
          }
        }
      }
    }

    for (tid = 0; tid < no_of_nodes; ++tid) {
      if (unchecked(h_updating_graph_mask[tid])) {
        unchecked((h_graph_mask[tid] = true));
        unchecked((h_graph_visited[tid] = true));
        stop = true;
        unchecked((h_updating_graph_mask[tid] = false));
      }
    }
    ++k;
  } while (stop);
}

function InitializeGraph(no_of_nodes: i32): Graph {
  var h_graph_nodes = new StaticArray<Node>(no_of_nodes);
  var h_graph_mask = new StaticArray<bool>(no_of_nodes);
  var h_updating_graph_mask = new StaticArray<bool>(no_of_nodes);
  var h_graph_visited = new StaticArray<bool>(no_of_nodes);
  var h_cost = new StaticArray<i32>(no_of_nodes);

  var source: i32 = 0;
  var graph = new StaticArray<Array<Edge>>(no_of_nodes);

  var i: i32;
  var j: i32;
  var no_of_edges: i32;

  for (i = 0; i < no_of_nodes; ++i) {
    unchecked((graph[i] = new Array<Edge>()));
  }

  for (i = 0; i < no_of_nodes; ++i) {
    no_of_edges =
      <i32>Math.abs(commonRandom() % (MAX_INIT_EDGES - MIN_EDGES + 1)) +
      MIN_EDGES;
    for (j = 0; j < no_of_edges; ++j) {
      var node_id = <i32>Math.abs(commonRandom() % no_of_nodes);
      var weight =
        <i32>Math.abs(commonRandom() % (MAX_WEIGHT - MIN_WEIGHT + 1)) +
        MIN_WEIGHT;

      unchecked(graph[i].push(edge(node_id, weight)));
      unchecked(graph[node_id].push(edge(i, weight)));
    }
  }

  var total_edges = 0;
  for (i = 0; i < no_of_nodes; ++i) {
    no_of_edges = unchecked(graph[i].length);
    unchecked((h_graph_nodes[i] = new Node(total_edges, no_of_edges)));
    unchecked((h_graph_mask[i] = false));
    unchecked((h_updating_graph_mask[i] = false));
    unchecked((h_graph_visited[i] = false));

    total_edges += no_of_edges;
  }

  unchecked((h_graph_mask[source] = true));
  unchecked((h_graph_visited[source] = true));

  var h_graph_edges = new StaticArray<i32>(total_edges);

  var k = 0;
  for (i = 0; i < no_of_nodes; ++i) {
    for (j = 0; j < unchecked(graph[i].length); ++j) {
      unchecked((h_graph_edges[k] = graph[i][j].dest));
      ++k;
    }
  }

  for (i = 0; i < no_of_nodes; ++i) {
    unchecked((h_cost[i] = i32.MAX_VALUE));
  }
  unchecked((h_cost[source] = 0));

  return {
    h_graph_nodes: h_graph_nodes,
    h_graph_mask: h_graph_mask,
    h_updating_graph_mask: h_updating_graph_mask,
    h_graph_visited: h_graph_visited,
    h_cost: h_cost,
    h_graph_edges: h_graph_edges,
  };
}
