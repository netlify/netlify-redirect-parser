const test = require('ava')
const { each } = require('test-each')

const { parseNetlifyConfig } = require('..')

const { FIXTURES_DIR, normalizeRedirect } = require('./helpers/main')

const parseRedirects = async function (fixtureName) {
  return await parseNetlifyConfig(`${FIXTURES_DIR}/${fixtureName}`)
}

each(
  [
    {
      title: 'netlify.toml',
      output: [
        {
          path: '/old-path',
          to: '/new-path',
          status: 301,
          query: {
            path: ':path',
          },
          conditions: {
            Country: ['US'],
            Language: ['en'],
            Role: ['admin'],
          },
        },
        {
          path: '/search',
          to: 'https://api.mysearch.com',
          status: 200,
          proxy: true,
          force: true,
          signed: 'API_SIGNATURE_TOKEN',
          headers: {
            'X-From': 'Netlify',
          },
        },
      ],
    },
  ],
  ({ title }, { fixtureName = title, output }) => {
    test(`Parses netlify.toml redirects | ${title}`, async (t) => {
      t.deepEqual(await parseRedirects(fixtureName), output.map(normalizeRedirect))
    })
  },
)
