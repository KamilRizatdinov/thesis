#!/bin/bash

BENCHMARK_DIR=$1
ASC_SOURCE=$2
ASC_ENVIRONMENT=$3
ASC_OPTIMIZER=$4
ASC_RUNTIME=$5

run_build () {  
  echo ============================================
  echo $BENCHMARK_DIR: Building ⏳

  cd $BENCHMARK_DIR

  SOURCEFILE=./assemblyscript/$ASC_SOURCE/index.ts
  ASCONFIG=./assemblyscript/asconfig.json
  TARGETFILE=./build/assemblyscript/index.js
  TMPFILE=./build/assemblyscript/tmp.js

  rm -rf ./build

  # AssemblyScript

  npx asc $SOURCEFILE  --config $ASCONFIG  --target $ASC_ENVIRONMENT -${ASC_OPTIMIZER} --runtime ${ASC_RUNTIME}

  mv $TARGETFILE $TMPFILE

  LINE=$(cat ./build/assemblyscript/tmp.js | grep -n "export const" | cut -d : -f 1)

  head -n $LINE $TMPFILE | sed -e '$ d' > $TARGETFILE

  {
    echo "export const {main} ="
    echo "typeof globalThis.fetch === 'function'"
    echo "  ? await (async url => instantiate(await WebAssembly.compileStreaming(globalThis.fetch(url)), {}))(new URL('index.wasm', import.meta.url))"
    echo "  : await instantiate(new WebAssembly.Module(readbuffer(arguments[0])), {});"
  } >> $TARGETFILE

  rm -f $TMPFILE

  cp bench.html ./build

  # JavaScript
  cp -r javascript/ ./build/javascript

  cp ./bench.js ./build/assemblyscript
  cp ./bench.js ./build/javascript

  echo $BENCHMARK_DIR: Done ✅

  cd ../../../../
}

if [[ $BENCHMARK_DIR = "all" ]] 
then
  for file in $(find ./**/cases/* -mindepth 1 -maxdepth 1 -type d)
  do
    BENCHMARK_DIR=$file
    run_build
  done
else
  run_build
fi





