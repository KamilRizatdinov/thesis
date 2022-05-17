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
  h_graph_nodes: Array<Node>;
  h_graph_mask: Array<bool>;
  h_updating_graph_mask: Array<bool>;
  h_graph_visited: Array<bool>;
  h_cost: Array<i32>;
  h_graph_edges: Array<i32>;
}

function edge(dest: i32, weight: i32): Edge {
  return {
    dest: dest,
    weight: weight,
  };
}

function InitializeGraph(no_of_nodes: i32): Graph {
  var h_graph_nodes = new Array<Node>(no_of_nodes);
  var h_graph_mask = new Array<bool>(no_of_nodes);
  var h_updating_graph_mask = new Array<bool>(no_of_nodes);
  var h_graph_visited = new Array<bool>(no_of_nodes);
  var h_cost = new Array<i32>(no_of_nodes);

  var source: i32 = 0;
  var graph = new Array<Array<Edge>>(no_of_nodes);

  var i: i32;
  var j: i32;
  var no_of_edges: i32;

  for (i = 0; i < no_of_nodes; ++i) {
    graph[i] = new Array<Edge>();
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

      graph[i].push(edge(node_id, weight));
      graph[node_id].push(edge(i, weight));
    }
  }

  var total_edges = 0;
  for (i = 0; i < no_of_nodes; ++i) {
    no_of_edges = graph[i].length;
    h_graph_nodes[i] = new Node(total_edges, no_of_edges);
    h_graph_mask[i] = false;
    h_updating_graph_mask[i] = false;
    h_graph_visited[i] = false;

    total_edges += no_of_edges;
  }

  h_graph_mask[source] = true;
  h_graph_visited[source] = true;

  var h_graph_edges = new Array<i32>(total_edges);

  var k = 0;
  for (i = 0; i < no_of_nodes; ++i) {
    for (j = 0; j < graph[i].length; ++j) {
      h_graph_edges[k] = graph[i][j].dest;
      ++k;
    }
  }

  for (i = 0; i < no_of_nodes; ++i) {
    h_cost[i] = i32.MAX_VALUE;
  }
  h_cost[source] = 0;

  // console.log(h_graph_mask.join(' '));
  // console.log(h_updating_graph_mask.join(' '));
  // console.log(h_graph_visited.join(' '));
  // console.log(h_cost.join(' '));
  // console.log(h_graph_edges.join(' '));

  return {
    h_graph_nodes: h_graph_nodes,
    h_graph_mask: h_graph_mask,
    h_updating_graph_mask: h_updating_graph_mask,
    h_graph_visited: h_graph_visited,
    h_cost: h_cost,
    h_graph_edges: h_graph_edges,
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
      if (h_graph_mask[tid]) {
        h_graph_mask[tid] = false;
        for (
          i = h_graph_nodes[tid].starting;
          i < h_graph_nodes[tid].no_of_edges + h_graph_nodes[tid].starting;
          ++i
        ) {
          var id = h_graph_edges[i];
          if (!h_graph_visited[id]) {
            h_cost[id] = h_cost[tid] + 1;
            h_updating_graph_mask[id] = true;
          }
        }
      }
    }

    for (tid = 0; tid < no_of_nodes; ++tid) {
      if (h_updating_graph_mask[tid]) {
        h_graph_mask[tid] = true;
        h_graph_visited[tid] = true;
        stop = true;
        h_updating_graph_mask[tid] = false;
      }
    }
    ++k;
  } while (stop);

  // console.log(h_cost.join(' '));
}
