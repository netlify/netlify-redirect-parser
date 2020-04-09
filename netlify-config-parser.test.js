const path = require('path')

const test = require('ava')
const parser = require('./netlify-config-parser')

const testFilesDir = path.resolve('__dirname', '../', 'test-files')

test('netlify.toml redirects parsing', async t => {
  const result = await parser.parse(path.resolve(testFilesDir, 'netlify.toml'))
  t.deepEqual(
    [
      {
        path: '/old-path',
        to: '/new-path',
        status: 301,
        conditions: {
          Country: ['US'],
          Language: ['en'],
          Role: ['admin'],
        },
        force: false,
        params: {
          path: ':path',
        },
      },
      {
        path: '/search',
        to: 'https://api.mysearch.com',
        status: 200,
        force: true,
        signed: 'API_SIGNATURE_TOKEN',
        proxy: true,
        headers: {
          'X-From': 'Netlify',
        },
      },
    ],
    result.success
  )
})

test('netlify.yml redirects parsing', async t => {
  const result = await parser.parse(path.resolve(testFilesDir, 'netlify.yml'))
  t.deepEqual(
    [
      {
        path: '/old-path',
        to: '/new-path',
        status: 301,
        conditions: {
          Country: ['US'],
          Language: ['en'],
          Role: ['admin'],
        },
        force: false,
        params: {
          path: ':path',
        },
      },
      {
        path: '/search',
        to: 'https://api.mysearch.com',
        status: 200,
        force: true,
        signed: 'API_SIGNATURE_TOKEN',
        proxy: true,
        headers: {
          'X-From': 'Netlify',
        },
      },
    ],
    result.success
  )
})