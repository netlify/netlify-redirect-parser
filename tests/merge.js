const test = require('ava')
const { each } = require('test-each')

const { mergeRedirects } = require('..')

each(
  [
    { output: [] },
    { fileRedirects: [], configRedirects: [], output: [] },
    {
      fileRedirects: [
        {
          origin: '/one',
          from: '/one',
          to: '/two',
        },
      ],
      configRedirects: [],
      output: [
        {
          origin: '/one',
          from: '/one',
          to: '/two',
        },
      ],
    },
    {
      fileRedirects: [],
      configRedirects: [
        {
          origin: '/one',
          from: '/one',
          to: '/three',
        },
      ],
      output: [
        {
          origin: '/one',
          from: '/one',
          to: '/three',
        },
      ],
    },
    {
      fileRedirects: [
        {
          origin: '/one',
          from: '/one',
          to: '/two',
        },
      ],
      configRedirects: [
        {
          origin: '/one',
          from: '/one',
          to: '/three',
        },
      ],
      output: [
        {
          origin: '/one',
          from: '/one',
          to: '/two',
        },
        {
          origin: '/one',
          from: '/one',
          to: '/three',
        },
      ],
    },
  ],
  ({ title }, { fileRedirects, configRedirects, output }) => {
    test(`Merges _redirects with netlify.toml redirects | ${title}`, (t) => {
      t.deepEqual(mergeRedirects({ fileRedirects, configRedirects }), output)
    })
  },
)

each(
  [
    { fileRedirects: { from: '/one', to: '/three' }, errorMessage: /should be an array/ },
    { configRedirects: { from: '/one', to: '/three' }, errorMessage: /should be an array/ },
  ],
  ({ title }, { fileRedirects, configRedirects, errorMessage }) => {
    test(`Validate syntax errors | ${title}`, async (t) => {
      await t.throws(mergeRedirects.bind(undefined, { fileRedirects, configRedirects }), errorMessage)
    })
  },
)
