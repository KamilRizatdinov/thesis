#!/bin/bash

v8 --module ./assemblyscript/bench.js -- ./build/assemblyscript/index.wasm

v8 --module ./javascript/bench.js
