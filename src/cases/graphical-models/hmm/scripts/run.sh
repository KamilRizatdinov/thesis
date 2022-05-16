#!/bin/bash

LANG=$1

if [ $LANG = "A" ]
then
  echo "AssemblyScript"
  v8 --module ./assemblyscript/bench.js -- ./build/assemblyscript/index.wasm
else
  echo "JavaScript"
  v8 --module ./javascript/bench.js
fi