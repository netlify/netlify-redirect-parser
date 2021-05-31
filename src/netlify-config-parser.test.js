const path = require('path')

const test = require('ava')

const parser = require('./netlify-config-parser')

const testFilesDir = path.resolve('__dirname', '../', 'test-files')

test('netlify.toml redirects parsing', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'netlify.toml'))
  t.deepEqual(result.success, [
    {
      path: '/old-path',
      to: '/new-path',
      status: 301,
      proxy: false,
      force: false,
      signed: false,
      conditions: {
        Country: ['US'],
        Language: ['en'],
        Role: ['admin'],
      },
      params: {
        path: ':path',
      },
    },
    {
      path: '/search',
      to: 'https://api.mysearch.com',
      status: 200,
      proxy: true,
      force: true,
      signed: 'API_SIGNATURE_TOKEN',
      conditions: {},
      headers: {
        'X-From': 'Netlify',
      },
    },
  ])
})
