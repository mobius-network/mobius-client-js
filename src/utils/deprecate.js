// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
export default function deprecate(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (global.process === undefined) {
    return function dep(...args) {
      return exports.deprecate(fn, msg).apply(this, ...args);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  let warned = false;
  function deprecated(...args) {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, ...args);
  }

  return deprecated;
}
