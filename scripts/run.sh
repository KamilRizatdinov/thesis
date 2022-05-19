#!/bin/bash

BENCHMARK_DIR=$1
LANG=$2
ENVIRONMENT=$3

function run () {
  echo ============================================

  cd $BENCHMARK_DIR

  if [[ $LANG = "all" ]] || [[ $LANG = "asc" ]]
  then
    echo $BENCHMARK_DIR: AssemblyScript Liftoff ⏳
    echo asc_liftoff > ./results/asc_liftoff.txt
    v8 --module --liftoff-only ./build/assemblyscript/bench.js -- ./build/assemblyscript/index.wasm >> ./results/asc_liftoff.txt
    echo $BENCHMARK_DIR: AssemblyScript Turbofan ⏳
    echo asc_turbofan > ./results/asc_turbofan.txt
    v8 --module --no-liftoff --no-wasm-tier-up ./build/assemblyscript/bench.js -- ./build/assemblyscript/index.wasm >> ./results/asc_turbofan.txt
  fi

  if [[ $LANG = "all" ]] || [[ $LANG = "js" ]]
  then
    echo $BENCHMARK_DIR: JavaScript Ignition ⏳
    echo js_ignition > ./results/js_ignition.txt
    v8 --module --no-opt ./build/javascript/bench.js >> ./results/js_ignition.txt
    echo $BENCHMARK_DIR: JavaScript Sparkplug ⏳
    echo js_sparkplug > ./results/js_sparkplug.txt
    v8 --module --sparkplug --always-sparkplug ./build/javascript/bench.js >> ./results/js_sparkplug.txt
    echo $BENCHMARK_DIR: JavaScript Turbofan ⏳
    echo js_turbofan > ./results/js_turbofan.txt
    v8 --module ./build/javascript/bench.js >> ./results/js_turbofan.txt
  fi

  echo $BENCHMARK_DIR: Generating reports ⏳

  rm -f ./results/results.csv
  rm -f ./results/results.html
  paste -d "," ./results/asc_liftoff.txt ./results/asc_turbofan.txt ./results/js_ignition.txt ./results/js_sparkplug.txt ./results/js_turbofan.txt > ./results/results.csv
  cat ./results/results.csv | npx chart-csv > ./results/results.html

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