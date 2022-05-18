#!/bin/bash

BENCHMARK_DIR=$1
LANG=$2
ENVIRONMENT=$3

function run () {
  echo ============================================

  cd $BENCHMARK_DIR

  if [[ $LANG = "all" ]]
  then
    echo $BENCHMARK_DIR: AssemblyScript ⏳
    v8 --module ./assemblyscript/bench.js -- ./build/assemblyscript/index.wasm
    echo $BENCHMARK_DIR: JavaScript ⏳
    v8 --module ./javascript/bench.js
  elif [[ $LANG = "asc" ]]
  then
    echo $BENCHMARK_DIR: AssemblyScript Liftoff ⏳
    v8 --module --liftoff-only ./assemblyscript/bench.js -- ./build/assemblyscript/index.wasm
    echo $BENCHMARK_DIR: AssemblyScript Turbofan ⏳
    v8 --module --no-liftoff --no-wasm-tier-up ./assemblyscript/bench.js -- ./build/assemblyscript/index.wasm
  elif [[ $LANG = "js" ]]
  then
    echo $BENCHMARK_DIR: JavaScript Ignition ⏳
    v8 --module --no-opt ./javascript/bench.js
    echo $BENCHMARK_DIR: JavaScript Sparkplug ⏳
    v8 --module --sparkplug --always-sparkplug ./javascript/bench.js
    echo $BENCHMARK_DIR: JavaScript Turbofan ⏳
    v8 --module ./javascript/bench.js
  else
    echo Language $LANG is not implemented ❌
    exit 0
  fi

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