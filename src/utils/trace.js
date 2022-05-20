export function init() {
  console.log(
    'time,iteration,name,isFunction,neverOptimize,alwaysOptimize,maybeDeopted,optimized,maglevved,turboFanned,interpreted,markedForOptimization,markedForConcurrentOptimization,optimizingConcurrently,isExecuting,topmostFrameIsTurboFanned,liteMode,markedForDeoptimization,baseline,topmostFrameIsInterpreted,topmostFrameIsBaseline',
  );
}

export function formatResults(results) {
  return zip(results)
    .map(result => result.join('\n'))
    .join('\n');
}

export function getFunctionsStatuses(fns) {
  const results = fns.map(fn => getFunctionStatus(fn));
  return results;
}

function getFunctionStatus(fn) {
  // NOTE: you should use --allow-natives-syntax in order to use V8 API calls
  const status = %GetOptimizationStatus(fn).toString(2).padStart(18, '0');
  const result = `${fn.name},` + status.split('').reverse().join();

  return result;
}

function zip(arrays) {
  return arrays[0].map(function (_, i) {
    return arrays.map(function (array) {
      return array[i];
    });
  });
}
