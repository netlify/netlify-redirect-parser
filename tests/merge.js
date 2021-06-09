const test = require('ava')
const { each } = require('test-each')

const { mergeRedirects } = require('..')

each(
  [
    { fileRedirects: [], configRedirects: [], output: [] },
    { fileRedirects: [{ from: '/one', to: '/two' }], configRedirects: [], output: [{ from: '/one', to: '/two' }] },
    { fileRedirects: [], configRedirects: [{ from: '/one', to: '/three' }], output: [{ from: '/one', to: '/three' }] },
    {
      fileRedirects: [{ from: '/one', to: '/two' }],
      configRedirects: [{ from: '/one', to: '/three' }],
      output: [
        { from: '/one', to: '/two' },
        { from: '/one', to: '/three' },
      ],
    },
  ],
  ({ title }, { fileRedirects, configRedirects, output }) => {
    test(`Merges _redirects with netlify.toml redirects | ${title}`, (t) => {
      t.deepEqual(mergeRedirects({ fileRedirects, configRedirects }), output)
    })
  },
)
