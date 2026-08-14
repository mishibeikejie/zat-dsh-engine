/* Zat-DSH Engine — strict host wire definitions.
 *
 * Hand-written in the official typert-loader manifest format (same shape as
 * the generated artifacts). The typert-loader registers this manifest into
 * the host typert registry on mount, so every DSH version recognizes the
 * pluginMarket endpoints — including builds without the SRC discovery
 * fallback. Do not edit without re-checking the loader validation rules. */

import { z } from 'zod'

const PKG = 'zat-dsh-engine'

const zUnknown = z.unknown()
const zString = z.string()
const zNumber = z.number()
const zBoolean = z.boolean()
const zArray = z.array(z.unknown())

const jsonResult = (method) => ({
  mode: 'strict',
  typeSymbol: `${PKG}#${method}#result`,
  schema: zUnknown,
})

const strParam = (method, name) => ({
  name,
  wire: name,
  source: 'json',
  codec: { mode: 'strict', typeSymbol: `${PKG}#${method}#${name}`, schema: zString },
})

const numParam = (method, name) => ({
  name,
  wire: name,
  source: 'json',
  codec: { mode: 'strict', typeSymbol: `${PKG}#${method}#${name}`, schema: zNumber },
})

const boolParam = (method, name) => ({
  name,
  wire: name,
  source: 'json',
  codec: { mode: 'strict', typeSymbol: `${PKG}#${method}#${name}`, schema: zBoolean },
})

const arrParam = (method, name) => ({
  name,
  wire: name,
  source: 'json',
  codec: { mode: 'strict', typeSymbol: `${PKG}#${method}#${name}`, schema: zArray },
})

const inv = (method, parameters) => ({
  id: `${PKG}#pluginMarket/${method}`,
  service: 'pluginMarket',
  namespace: 'pluginMarket',
  method,
  invocation: { kind: 'direct' },
  parameters,
  result: jsonResult(method),
})

export const TYPERT = {
  package: PKG,
  face: 'host',
  schemas: [],
  invocations: [
    inv('list', [numParam('list', 'page'), strParam('list', 'sort'), strParam('list', 'q'), strParam('list', 'category')]),
    inv('versions', []),
    inv('translate', [arrParam('translate', 'items')]),
    inv('installed', []),
    inv('detail', [strParam('detail', 'owner'), strParam('detail', 'repo')]),
    inv('selfupdate', [boolParam('selfupdate', 'doUpdate')]),
    inv('installPlugin', [strParam('installPlugin', 'owner'), strParam('installPlugin', 'repo')]),
    inv('update', [strParam('update', 'owner'), strParam('update', 'repo')]),
    inv('uninstall', [strParam('uninstall', 'name')]),
  ],
  model: {
    services: [],
    events: [],
    objects: [],
  },
}
