const test = require('ava')
const { each } = require('test-each')

const { mergeRedirects } = require('../src/merge')

each(
  [
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
