const test = require('ava')

const { parseRedirectsFormat } = require('..')

const FIXTURES_DIR = `${__dirname}/fixtures`

const parseRedirects = async function (fixtureName) {
  return await parseRedirectsFormat(`${FIXTURES_DIR}/${fixtureName}`)
}

test('simple redirects', async (t) => {
  const redirects = await parseRedirects('simple_redirects')
  t.deepEqual(redirects, [
    { path: '/home', to: '/', proxy: false, force: false, query: {}, conditions: {}, headers: {}, edgeHandlers: [] },
    {
      path: '/blog/my-post.php',
      to: '/blog/my-post',
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/blog/my-post-ads.php',
      to: '/blog/my-post#ads',
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/news',
      to: '/blog',
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('redirects with status codes', async (t) => {
  const redirects = await parseRedirects('status_code_redirects')
  t.deepEqual(redirects, [
    {
      path: '/home',
      to: '/',
      status: 301,
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/my-redirect',
      to: '/',
      status: 302,
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/pass-through',
      to: '/',
      status: 200,
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/ecommerce',
      to: '/store-closed',
      status: 404,
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('redirects with parameter matches', async (t) => {
  const redirects = await parseRedirects('parameter_match_redirects')
  t.deepEqual(redirects, [
    {
      path: '/',
      to: '/news',
      proxy: false,
      force: false,
      query: { page: 'news' },
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/blog',
      to: '/blog/:post_id',
      proxy: false,
      force: false,
      query: { post: ':post_id' },
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/',
      to: '/about',
      status: 301,
      proxy: false,
      force: false,
      query: { _escaped_fragment_: '/about' },
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('redirects with full hostname', async (t) => {
  const redirects = await parseRedirects('full_hostname_redirects')
  t.deepEqual(redirects, [
    {
      host: 'hello.bitballoon.com',
      scheme: 'http',
      path: '/*',
      to: 'http://www.hello.com/:splat',
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('proxy instruction', async (t) => {
  const redirects = await parseRedirects('proxy_redirects')
  t.deepEqual(redirects, [
    {
      path: '/api/*',
      to: 'https://api.bitballoon.com/*',
      status: 200,
      proxy: true,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('redirect with country conditions', async (t) => {
  const redirects = await parseRedirects('country_redirects')
  t.deepEqual(redirects, [
    {
      path: '/',
      to: '/china',
      status: 302,
      proxy: false,
      force: false,
      query: {},
      conditions: { Country: 'ch,tw' },
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('redirect with country and language conditions', async (t) => {
  const redirects = await parseRedirects('country_language_redirects')
  t.deepEqual(redirects, [
    {
      path: '/',
      to: '/china',
      status: 302,
      proxy: false,
      force: false,
      query: {},
      conditions: { Country: 'il', Language: 'en' },
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('splat based redirect with no force instruction', async (t) => {
  const redirects = await parseRedirects('splat_no_force_redirects')
  t.deepEqual(redirects, [
    {
      path: '/*',
      to: 'https://www.bitballoon.com/:splat',
      status: 301,
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('splat based redirect with force instruction', async (t) => {
  const redirects = await parseRedirects('splat_force_redirects')
  t.deepEqual(redirects, [
    {
      path: '/*',
      to: 'https://www.bitballoon.com/:splat',
      status: 301,
      proxy: false,
      force: true,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('redirect rule with equal', async (t) => {
  const redirects = await parseRedirects('equal_redirects')
  t.deepEqual(redirects, [
    {
      path: '/test',
      to: 'https://www.bitballoon.com/test=hello',
      status: 301,
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('some real world edge case rules', async (t) => {
  const redirects = await parseRedirects('realworld_redirects')
  t.deepEqual(redirects, [
    {
      path: '/donate',
      to: '/donate/usa?source=:source&email=:email',
      status: 302,
      proxy: false,
      force: false,
      query: { source: ':source', email: ':email' },
      conditions: { Country: 'us' },
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/',
      to: 'https://origin.wework.com',
      status: 200,
      proxy: true,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/:lang/locations/*',
      to: '/locations/:splat',
      status: 200,
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('rules with no destination', async (t) => {
  await t.throwsAsync(parseRedirects('no_destination_redirects'), /Missing destination/)
})

test('rules with complex redirects', async (t) => {
  const redirects = await parseRedirects('complex_redirects')
  t.is(redirects.length, 1)
  t.is(
    redirects[0].to,
    'https://goo.gl/app/playmusic?ibi=com.google.PlayMusic&isi=691797987&ius=googleplaymusic&link=https://play.google.com/music/m/Ihj4yege3lfmp3vs5yoopgxijpi?t%3DArrested_DevOps',
  )
})

test('complicated _redirects file', async (t) => {
  const redirects = await parseRedirects('complicated_redirects')
  t.is(redirects.length, 26)
  redirects.forEach((rule) => {
    t.regex(rule.to, /^http/)
  })
})

test('long _redirects file', async (t) => {
  await t.throwsAsync(parseRedirects('redirects'), /Missing source or destination/)
})

test('redirect with proxy signing', async (t) => {
  const redirects = await parseRedirects('proxy_signing_redirects')
  t.deepEqual(redirects[0], {
    path: '/api/*',
    to: 'https://api.example.com/:splat',
    status: 200,
    proxy: true,
    force: true,
    signed: 'API_SECRET',
    query: {},
    conditions: {},
    headers: {},
    edgeHandlers: [],
  })
})

test('absolute redirects with country condition', async (t) => {
  const redirects = await parseRedirects('absolute_country_redirects')
  t.deepEqual(redirects[0], {
    host: 'ximble.com.au',
    scheme: 'http',
    path: '/*',
    to: 'https://www.ximble.com/au/:splat',
    status: 301,
    proxy: false,
    force: true,
    query: {},
    conditions: { Country: 'au' },
    headers: {},
    edgeHandlers: [],
  })
})

test('redirect role conditions', async (t) => {
  const redirects = await parseRedirects('role_condition_redirects')
  t.deepEqual(redirects, [
    {
      path: '/admin/*',
      to: '/admin/:splat',
      status: 200,
      proxy: false,
      force: false,
      query: {},
      conditions: { Role: 'admin' },
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('redirect with multiple roles', async (t) => {
  const redirects = await parseRedirects('multiple_roles_redirects')
  t.deepEqual(redirects, [
    {
      path: '/member/*',
      to: '/member/:splat',
      status: 200,
      proxy: false,
      force: false,
      query: {},
      conditions: { Role: 'admin,member' },
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('parse forward rule', async (t) => {
  const redirects = await parseRedirects('path_forward_redirects')
  t.deepEqual(redirects, [
    {
      path: '/admin/*',
      to: '/admin/:splat',
      status: 200,
      proxy: false,
      force: false,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/admin/*',
      to: '/admin/:splat',
      status: 200,
      proxy: false,
      force: true,
      query: {},
      conditions: {},
      headers: {},
      edgeHandlers: [],
    },
  ])
})

test('parse mistaken _headers file', async (t) => {
  await t.throwsAsync(parseRedirects('mistaken_headers'), /Missing source or destination/)
})

test('valid service destination path', async (t) => {
  const redirects = await parseRedirects('service_redirects')
  t.is(redirects.length, 1)
})
