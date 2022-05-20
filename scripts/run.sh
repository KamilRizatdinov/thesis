#!/bin/bash

BENCHMARK_DIR=$1
LANG=$2
ENVIRONMENT=$3
TYPE=$4

BENCHMARK_RESULTS_DIR=./results/benchmark
TRACE_RESULTS_DIR=./results/trace

function run_bench () {
  if [[ $LANG = "all" ]] || [[ $LANG = "asc" ]]
  then
    echo $BENCHMARK_DIR: AssemblyScript Turbofan ⏳
    echo asc_turbofan > $BENCHMARK_RESULTS_DIR/asc_turbofan.txt
    v8 --module --no-liftoff --no-wasm-tier-up ./build/assemblyscript/bench.js -- ./build/assemblyscript/index.wasm >> $BENCHMARK_RESULTS_DIR/asc_turbofan.txt
    echo $BENCHMARK_DIR: AssemblyScript Liftoff ⏳
    echo asc_liftoff > $BENCHMARK_RESULTS_DIR/asc_liftoff.txt
    v8 --module --liftoff-only ./build/assemblyscript/bench.js -- ./build/assemblyscript/index.wasm >> $BENCHMARK_RESULTS_DIR/asc_liftoff.txt
  fi

  if [[ $LANG = "all" ]] || [[ $LANG = "js" ]]
  then
  echo $BENCHMARK_DIR: JavaScript Turbofan ⏳
    echo js_turbofan > $BENCHMARK_RESULTS_DIR/js_turbofan.txt
    v8 --module ./build/javascript/bench.js >> $BENCHMARK_RESULTS_DIR/js_turbofan.txt
    echo $BENCHMARK_DIR: JavaScript Sparkplug ⏳
    echo js_sparkplug > $BENCHMARK_RESULTS_DIR/js_sparkplug.txt
    v8 --module --sparkplug --always-sparkplug ./build/javascript/bench.js >> $BENCHMARK_RESULTS_DIR/js_sparkplug.txt
    echo $BENCHMARK_DIR: JavaScript Ignition ⏳
    echo js_ignition > $BENCHMARK_RESULTS_DIR/js_ignition.txt
    v8 --module --no-opt ./build/javascript/bench.js >> $BENCHMARK_RESULTS_DIR/js_ignition.txt    
  fi

  echo $BENCHMARK_DIR: Generating benchmark reports ⏳

  rm -f $BENCHMARK_RESULTS_DIR/results.csv
  rm -f $BENCHMARK_RESULTS_DIR/results.html
  paste -d "," $BENCHMARK_RESULTS_DIR/asc_liftoff.txt $BENCHMARK_RESULTS_DIR/asc_turbofan.txt $BENCHMARK_RESULTS_DIR/js_ignition.txt $BENCHMARK_RESULTS_DIR/js_sparkplug.txt $BENCHMARK_RESULTS_DIR/js_turbofan.txt > $BENCHMARK_RESULTS_DIR/results.csv
  cat $BENCHMARK_RESULTS_DIR/results.csv | npx chart-csv > $BENCHMARK_RESULTS_DIR/results.html
}

function run_trace () {
  echo $BENCHMARK_DIR: JavaScript ⏳
  v8 --module --allow-natives-syntax ./javascript/trace/index.js > $TRACE_RESULTS_DIR/results.csv
}

function run () {
  echo ============================================

  cd $BENCHMARK_DIR

  if [[ $TYPE = "benchmark" ]]
  then
    run_bench
  elif [[ $TYPE = "trace" ]]
  then
    run_trace
  else
    echo $BENCHMARK_DIR: No such type: $TYPE ❌
    exit 0
  fi

  echo $BENCHMARK_DIR: Done ✅

  cd ../../../../
}

if [[ $ENVIRONMENT = "browser" ]]
then
  npx serve .
fi

if [[ $BENCHMARK_DIR = "all" ]] 
then
  for file in $(find ./**/cases/* -mindepth 1 -maxdepth 1 -type d)
  do
    BENCHMARK_DIR=$file
    run
  done
else
  run
fi