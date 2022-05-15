#!/bin/bash

echo "AssemblyScript"
v8 --module ./assemblyscript/bench.js -- ./build/assemblyscript/index.wasm

echo "JavaScript"
v8 --module ./javascript/bench.js
