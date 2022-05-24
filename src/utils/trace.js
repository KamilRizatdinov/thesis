export function init() {
  console.log(
    'time,iteration,name,isFunction,neverOptimize,alwaysOptimize,maybeDeopted,optimized,turboFanned,interpreted,markedForOptimization,markedForConcurrentOptimization,optimizingConcurrently,isExecuting,topmostFrameIsTurboFanned,liteMode,markedForDeoptimization,baseline,topmostFrameIsInterpreted,topmostFrameIsBaseline',
  );
}

export function initHTML() {
  console.log(
    `<table>
      <tr>
        <th>time</th>
        <th>iteration</th>
        <th>name</th>
        <th>isFunction</th>
        <th>neverOptimize</th>
        <th>alwaysOptimize</th>
        <th>maybeDeopted</th>
        <th>optimized</th>
        <th>turboFanned</th>
        <th>interpreted</th>
        <th>markedForOptimization</th>
        <th>markedForConcurrentOptimization</th>
        <th>optimizingConcurrently</th>
        <th>isExecuting</th>
        <th>topmostFrameIsTurboFanned</th>
        <th>liteMode</th>
        <th>markedForDeoptimization</th>
        <th>baseline</th>
        <th>topmostFrameIsInterpreted</th>
        <th>topmostFrameIsBaselin</th>
      <tr>
      `,
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

export function getFunctionsStatusesHTML(fns) {
  const results = fns.map(fn => getFunctionStatusHTML(fn));
  return results;
}

function getFunctionStatus(fn) {
  // NOTE: you should use --allow-natives-syntax in order to use V8 API calls
  const status = %GetOptimizationStatus(fn).toString(2).padStart(17, '0');
  const result = `${fn.name},` + status.split('').reverse().join();

  return result;
}

function getFunctionStatusHTML(fn) {
  // NOTE: you should use --allow-natives-syntax in order to use V8 API calls
  const status = %GetOptimizationStatus(fn).toString(2).padStart(17, '0');
  const result =
    `<td>${fn.name}</td><td>` +
    status.split('').reverse().join('</td><td>') +
    '</td>';
  return result;
}

function zip(arrays) {
  return arrays[0].map(function (_, i) {
    return arrays.map(function (array) {
      return array[i];
    });
  });
}
