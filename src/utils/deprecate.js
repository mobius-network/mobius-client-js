/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 * If `--no-deprecation` flag is set , then it is a no-op.
 * (see for details https://nodejs.org/docs/latest-v8.x/api/cli.html#cli_no_deprecation)
 *
 * @param {function} fn - function or method to deprecate
 * @param {string} msg - deprecation message
 * @returns {function}
 */
export default function deprecate(fn, msg) {
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
