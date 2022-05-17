#!/bin/bash

LANG=$1

if [[ $LANG = "asc" ]]
then
  echo "Running AssemblyScript"
  v8 --module ./assemblyscript/bench.js -- ./build/assemblyscript/index.wasm
elif [[ $LANG = "js" ]]
then
  echo "Running JavaScript"
  v8 --module ./javascript/bench.js
else
  echo "Running AssemblyScript"
  v8 --module ./assemblyscript/bench.js -- ./build/assemblyscript/index.wasm
  echo "Running JavaScript"
  v8 --module ./javascript/bench.js
fi