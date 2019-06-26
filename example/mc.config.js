module.exports = {
  plugins: [
    require.resolve('./mc-plugin-example'),
  ],
  config: {
    react: { inferno: true },
    code: { barcode: true },
  },
  page: {
    index: {
      entry: './src/index',
      title: 'react component demo',
    },
  },
  dev: {
    path: '/index.html',
  },
}
