const path = require('path')

const test = require('ava')

const parser = require('./line-parser')

const testFilesDir = path.resolve('__dirname', '../', 'test-files')

test('simple redirects', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'simple_redirects'))
  t.deepEqual(result.success, [
    { path: '/home', to: '/' },
    { path: '/blog/my-post.php', to: '/blog/my-post' },
    { path: '/blog/my-post-ads.php', to: '/blog/my-post#ads' },
    { path: '/news', to: '/blog' },
  ])
})

test('redirects with status codes', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'status_code_redirects'))
  t.deepEqual(result.success, [
    { path: '/home', to: '/', status: 301 },
    { path: '/my-redirect', to: '/', status: 302 },
    { path: '/pass-through', to: '/', status: 200 },
    { path: '/ecommerce', to: '/store-closed', status: 404 },
  ])
})

test('redirects with parameter matches', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'parameter_match_redirects'))
  t.deepEqual(result.success, [
    { path: '/', to: '/news', params: { page: 'news' } },
    { path: '/blog', to: '/blog/:post_id', params: { post: ':post_id' } },
    {
      path: '/',
      to: '/about',
      params: { _escaped_fragment_: '/about' },
      status: 301,
    },
  ])
})

test('redirects with full hostname', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'full_hostname_redirects'))
  t.deepEqual(result.success, [
    {
      host: 'hello.bitballoon.com',
      scheme: 'http',
      path: '/*',
      to: 'http://www.hello.com/:splat',
    },
  ])
})

test('proxy instruction', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'proxy_redirects'))
  t.deepEqual(result.success, [
    {
      path: '/api/*',
      to: 'https://api.bitballoon.com/*',
      status: 200,
      proxy: true,
    },
  ])
})

test('redirect with country conditions', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'country_redirects'))
  t.deepEqual(result.success, [
    {
      path: '/',
      to: '/china',
      status: 302,
      conditions: { Country: 'ch,tw' },
    },
  ])
})

test('redirect with country and language conditions', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'country_language_redirects'))
  t.deepEqual(result.success, [
    {
      path: '/',
      to: '/china',
      status: 302,
      conditions: { Country: 'il', Language: 'en' },
    },
  ])
})

test('splat based redirect with no force instruction', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'splat_no_force_redirects'))
  t.deepEqual(result.success, [{ path: '/*', to: 'https://www.bitballoon.com/:splat', status: 301 }])
})

test('splat based redirect with force instruction', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'splat_force_redirects'))
  t.deepEqual(result.success, [
    {
      path: '/*',
      to: 'https://www.bitballoon.com/:splat',
      status: 301,
      force: true,
    },
  ])
})

test('redirect rule with equal', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'equal_redirects'))
  t.deepEqual(result.success, [
    {
      path: '/test',
      to: 'https://www.bitballoon.com/test=hello',
      status: 301,
    },
  ])
})

test('some real world edge case rules', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'realworld_redirects'))
  t.deepEqual(result.success, [
    {
      path: '/donate',
      to: '/donate/usa?source=:source&email=:email',
      params: { source: ':source', email: ':email' },
      status: 302,
      conditions: { Country: 'us' },
    },
    {
      path: '/',
      to: 'https://origin.wework.com',
      status: 200,
      proxy: true,
    },
    { path: '/:lang/locations/*', to: '/locations/:splat', status: 200 },
  ])
})

test('rules with no destination', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'no_destination_redirects'))
  t.is(result.success.length, 0)
  t.is(result.errors.length, 1)
})

test('rules with complex redirects', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'complex_redirects'))
  t.is(result.errors.length, 0)
  t.is(result.success.length, 1)
  t.is(
    result.success[0].to,
    'https://goo.gl/app/playmusic?ibi=com.google.PlayMusic&isi=691797987&ius=googleplaymusic&link=https://play.google.com/music/m/Ihj4yege3lfmp3vs5yoopgxijpi?t%3DArrested_DevOps',
  )
})

test('complicated _redirects file', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'complicated_redirects'))
  t.is(result.errors.length, 0)
  t.is(result.success.length, 26)
  result.success.forEach((rule) => {
    t.regex(rule.to, /^http/)
  })
})

test('long _redirects file', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'redirects'))
  t.deepEqual(
    result.errors.map(({ lineNum }) => lineNum),
    [640, 734, 917, 918, 919, 920, 987],
  )
  t.true(result.success.length !== 0)
})

test('redirect with proxy signing', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'proxy_signing_redirects'))
  t.deepEqual(result.success[0], {
    path: '/api/*',
    to: 'https://api.example.com/:splat',
    status: 200,
    force: true,
    signed: 'API_SECRET',
    proxy: true,
  })
})

test('absolute redirects with country condition', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'absolute_country_redirects'))
  t.deepEqual(result.success[0], {
    host: 'ximble.com.au',
    scheme: 'http',
    path: '/*',
    to: 'https://www.ximble.com/au/:splat',
    status: 301,
    force: true,
    conditions: { Country: 'au' },
  })
})

test('redirect role conditions', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'role_condition_redirects'))
  t.deepEqual(result.success, [
    {
      path: '/admin/*',
      to: '/admin/:splat',
      status: 200,
      conditions: { Role: 'admin' },
    },
  ])
})

test('redirect with multiple roles', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'multiple_roles_redirects'))
  t.deepEqual(result.success, [
    {
      path: '/member/*',
      to: '/member/:splat',
      status: 200,
      conditions: { Role: 'admin,member' },
    },
  ])
})

test('parse forward rule', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'path_forward_redirects'))
  t.deepEqual(result.success, [
    { path: '/admin/*', to: '/admin/:splat', status: 200 },
    { path: '/admin/*', to: '/admin/:splat', status: 200, force: true },
  ])
})

test('parse mistaken _headers file', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'mistaken_headers'))
  t.is(result.errors.length, 2)
})

test('valid service destination path', async (t) => {
  const result = await parser.parse(path.resolve(testFilesDir, 'service_redirects'))
  t.is(result.errors.length, 0)
  t.is(result.success.length, 1)
})
