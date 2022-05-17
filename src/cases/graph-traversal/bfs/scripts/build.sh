#!/bin/bash

ENVIRONMENT=$1
ASC_OPTIMIZER=$2
ASC_SOURCE=$3

# Remove previous build

rm -rf ./build

# AssemblyScript

SOURCEFILE=./assemblyscript/$ASC_SOURCE/index.ts
ASCONFIG=./assemblyscript/asconfig.json
TARGETFILE=./build/assemblyscript/index.js
TMPFILE=./build/assemblyscript/tmp.js


if [ $ASC_OPTIMIZER ]
then
  npx asc $SOURCEFILE  --config $ASCONFIG  --target $ENVIRONMENT -${ASC_OPTIMIZER}
else
  npx asc $SOURCEFILE  --config $ASCONFIG  --target $ENVIRONMENT
fi

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

# JavaScript

cp -r javascript/ ./build/javascript