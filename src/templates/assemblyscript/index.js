let func;
if (typeof globalThis.fetch === 'function') {
  func = await (async url =>
    instantiate(await WebAssembly.compileStreaming(globalThis.fetch(url)), {}))(
    new URL('index.wasm', import.meta.url),
  );
} else {
  const ascModule = new WebAssembly.Module(readbuffer(arguments[0]));
  func = await instantiate(ascModule, {});
}
