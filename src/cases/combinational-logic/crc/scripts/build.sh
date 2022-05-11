#!/bin/bash

ENVIRONMENT=$1

# Remove previous build

rm -rf ./build

# AssemblyScript

SOURCEFILE=./assemblyscript/index.ts
TARGETFILE=./build/$ENVIRONMENT/assemblyscript/index.js
TMPFILE=./build/$ENVIRONMENT/assemblyscript/tmp.js
ASCONFIG=./asconfig.json

npx asc $SOURCEFILE  --config $ASCONFIG  --target $ENVIRONMENT

mv $TARGETFILE $TMPFILE

if [ $ENVIRONMENT = 'debug' ]
then
  LINE=$(cat ./build/debug/assemblyscript/tmp.js | grep -n "export const" | cut -d : -f 1)
else
  LINE=$(cat ./build/release/assemblyscript/tmp.js | grep -n "export const" | cut -d : -f 1)
fi

head -n $LINE $TMPFILE | sed -e '$ d' > $TARGETFILE

{
  echo "let module;"
  echo "if (typeof globalThis.fetch === 'function') {"
  echo "module = await (async url =>"
  echo "instantiate(await WebAssembly.compileStreaming(globalThis.fetch(url)), {}))("
  echo "new URL('index.wasm', import.meta.url));"
  echo "} else {"
  echo "const ascModule = new WebAssembly.Module(readbuffer(arguments[0]));"
  echo "module = await instantiate(ascModule, {});}"
} >> $TARGETFILE

rm -f $TMPFILE

# JavaScript

if [ $ENVIRONMENT = 'debug' ]
then
  cp -r javascript/ ./build/debug/javascript
else
  cp -r javascript/ ./build/release/javascript
fi
