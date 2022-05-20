export function printFunctionsStatuses(fns) {
  const results = [
    'name,isFunction,neverOptimize,alwaysOptimize,maybeDeopted,optimized,maglevved,turboFanned,interpreted,markedForOptimization,markedForConcurrentOptimization,optimizingConcurrently,isExecuting,topmostFrameIsTurboFanned,liteMode,markedForDeoptimization,baseline,topmostFrameIsInterpreted,topmostFrameIsBaseline',
  ].concat(fns.map(fn => getFunctionStatus(fn)));

  console.log(results.join('\n'));
}

function getFunctionStatus(fn) {
  // NOTE: you should use --allow-natives-syntax in order to use V8 API calls
  const status = %GetOptimizationStatus(fn).toString(2).padStart(18, '0');
  const result = `${fn.name},` + status.split('').reverse().join();

  return result;
}
