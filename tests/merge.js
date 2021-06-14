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
          destination: '/two',
        },
      ],
      configRedirects: [],
      output: [
        {
          origin: '/one',
          from: '/one',
          destination: '/two',
        },
      ],
    },
    {
      fileRedirects: [],
      configRedirects: [
        {
          origin: '/one',
          from: '/one',
          destination: '/three',
        },
      ],
      output: [
        {
          origin: '/one',
          from: '/one',
          destination: '/three',
        },
      ],
    },
    {
      fileRedirects: [
        {
          origin: '/one',
          from: '/one',
          destination: '/two',
        },
      ],
      configRedirects: [
        {
          origin: '/one',
          from: '/one',
          destination: '/three',
        },
      ],
      output: [
        {
          origin: '/one',
          from: '/one',
          destination: '/two',
        },
        {
          origin: '/one',
          from: '/one',
          destination: '/three',
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
    { fileRedirects: { from: '/one', destination: '/three' }, errorMessage: /should be an array/ },
    { configRedirects: { from: '/one', destination: '/three' }, errorMessage: /should be an array/ },
  ],
  ({ title }, { fileRedirects, configRedirects, errorMessage }) => {
    test(`Validate syntax errors | ${title}`, async (t) => {
      await t.throws(mergeRedirects.bind(undefined, { fileRedirects, configRedirects }), errorMessage)
    })
  },
)
