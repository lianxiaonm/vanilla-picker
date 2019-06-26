const path = require('path')

module.exports = {
  apply(kobe) {
    kobe.addAlias({
      'vanilla-picker': path.dirname(require.resolve('../../src')),
      'vanilla-picker/lib': path.dirname(require.resolve('../../src')),
    })
  },
}
