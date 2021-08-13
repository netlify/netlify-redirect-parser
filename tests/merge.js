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
          from: '/one',
          to: '/two',
        },
      ],
      configRedirects: [],
      output: [
        {
          from: '/one',
          to: '/two',
        },
      ],
    },
    {
      fileRedirects: [],
      configRedirects: [
        {
          from: '/one',
          to: '/three',
        },
      ],
      output: [
        {
          from: '/one',
          to: '/three',
        },
      ],
    },
    {
      fileRedirects: [
        {
          from: '/one',
          to: '/two',
        },
      ],
      configRedirects: [
        {
          from: '/one',
          to: '/three',
        },
      ],
      output: [
        {
          from: '/one',
          to: '/two',
        },
        {
          from: '/one',
          to: '/three',
        },
      ],
    },
    {
      fileRedirects: [
        {
          from: '/one',
          to: '/two',
        },
        {
          from: '/one',
          to: '/four',
        },
      ],
      configRedirects: [
        {
          from: '/one',
          to: '/two',
        },
        {
          from: '/one',
          to: '/three',
        },
      ],
      output: [
        {
          from: '/one',
          to: '/four',
        },
        {
          from: '/one',
          to: '/two',
        },
        {
          from: '/one',
          to: '/three',
        },
      ],
    },
  ],
  ({ title }, { fileRedirects, configRedirects, output }) => {
    test(`Merges _redirects with netlify.toml redirects | ${title}`, (t) => {
      const { redirects, errors } = mergeRedirects({ fileRedirects, configRedirects })
      t.is(errors.length, 0)
      t.deepEqual(redirects, output)
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
      const { redirects, errors } = await mergeRedirects({ fileRedirects, configRedirects })
      t.is(redirects.length, 0)
      // eslint-disable-next-line max-nested-callbacks
      t.true(errors.some((error) => errorMessage.test(error.message)))
    })
  },
)
