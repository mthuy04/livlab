// `server-only` is a build-time marker Next resolves itself; outside Next
// (these check scripts) it has no package to load. Resolve it to an empty
// module so server modules can be exercised from the command line.
import { registerHooks } from 'node:module';

const EMPTY = new URL('./empty.cjs', import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') return { url: EMPTY, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
