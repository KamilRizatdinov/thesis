#!/bin/bash

BENCHMARK_DIR=$1
LANG=$2

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
    echo $BENCHMARK_DIR: AssemblyScript ⏳
    v8 --module ./assemblyscript/bench.js -- ./build/assemblyscript/index.wasm
  elif [[ $LANG = "js" ]]
  then
    echo $BENCHMARK_DIR: JavaScript ⏳
    v8 --module ./javascript/bench.js
  else
    echo Language $LANG is not implemented ❌
    exit 0
  fi

  cd ../../../../
}

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