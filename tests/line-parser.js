const test = require('ava')

const { parseRedirectsFormat } = require('..')

const FIXTURES_DIR = `${__dirname}/fixtures`

const DEFAULT_REDIRECT = {
  proxy: false,
  force: false,
  query: {},
  conditions: {},
  headers: {},
  edgeHandlers: [],
}

const parseRedirects = async function (fixtureName) {
  return await parseRedirectsFormat(`${FIXTURES_DIR}/${fixtureName}`)
}

test('simple redirects', async (t) => {
  const redirects = await parseRedirects('simple_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/home',
      to: '/',
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/blog/my-post.php',
      to: '/blog/my-post',
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/blog/my-post-ads.php',
      to: '/blog/my-post#ads',
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/news',
      to: '/blog',
    },
  ])
})

test('redirects with status codes', async (t) => {
  const redirects = await parseRedirects('status_code_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/home',
      to: '/',
      status: 301,
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/my-redirect',
      to: '/',
      status: 302,
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/pass-through',
      to: '/',
      status: 200,
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/ecommerce',
      to: '/store-closed',
      status: 404,
    },
  ])
})

test('redirects with parameter matches', async (t) => {
  const redirects = await parseRedirects('parameter_match_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/',
      to: '/news',
      query: { page: 'news' },
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/blog',
      to: '/blog/:post_id',
      query: { post: ':post_id' },
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/',
      to: '/about',
      status: 301,
      query: { _escaped_fragment_: '/about' },
    },
  ])
})

test('redirects with full hostname', async (t) => {
  const redirects = await parseRedirects('full_hostname_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      host: 'hello.bitballoon.com',
      scheme: 'http',
      path: '/*',
      to: 'http://www.hello.com/:splat',
    },
  ])
})

test('proxy instruction', async (t) => {
  const redirects = await parseRedirects('proxy_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/api/*',
      to: 'https://api.bitballoon.com/*',
      status: 200,
      proxy: true,
    },
  ])
})

test('redirect with country conditions', async (t) => {
  const redirects = await parseRedirects('country_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/',
      to: '/china',
      status: 302,
      conditions: { Country: 'ch,tw' },
    },
  ])
})

test('redirect with country and language conditions', async (t) => {
  const redirects = await parseRedirects('country_language_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/',
      to: '/china',
      status: 302,
      conditions: { Country: 'il', Language: 'en' },
    },
  ])
})

test('splat based redirect with no force instruction', async (t) => {
  const redirects = await parseRedirects('splat_no_force_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/*',
      to: 'https://www.bitballoon.com/:splat',
      status: 301,
    },
  ])
})

test('splat based redirect with force instruction', async (t) => {
  const redirects = await parseRedirects('splat_force_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/*',
      to: 'https://www.bitballoon.com/:splat',
      status: 301,
      force: true,
    },
  ])
})

test('redirect rule with equal', async (t) => {
  const redirects = await parseRedirects('equal_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/test',
      to: 'https://www.bitballoon.com/test=hello',
      status: 301,
    },
  ])
})

test('some real world edge case rules', async (t) => {
  const redirects = await parseRedirects('realworld_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/donate',
      to: '/donate/usa?source=:source&email=:email',
      status: 302,
      query: { source: ':source', email: ':email' },
      conditions: { Country: 'us' },
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/',
      to: 'https://origin.wework.com',
      status: 200,
      proxy: true,
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/:lang/locations/*',
      to: '/locations/:splat',
      status: 200,
    },
  ])
})

test('rules with no destination', async (t) => {
  await t.throwsAsync(parseRedirects('no_destination_redirects'), /Missing destination/)
})

test('rules with complex redirects', async (t) => {
  const redirects = await parseRedirects('complex_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/google-play',
      to: 'https://goo.gl/app/playmusic?ibi=com.google.PlayMusic&isi=691797987&ius=googleplaymusic&link=https://play.google.com/music/m/Ihj4yege3lfmp3vs5yoopgxijpi?t%3DArrested_DevOps',
      status: 301,
      force: true,
    },
  ])
})

test('complicated _redirects file', async (t) => {
  const redirects = await parseRedirects('complicated_redirects')
  t.is(redirects.length, 26)
  redirects.forEach((rule) => {
    t.true(rule.to.startsWith('http'))
  })
})

test('long _redirects file', async (t) => {
  await t.throwsAsync(parseRedirects('redirects'), /Missing source or destination/)
})

test('redirect with proxy signing', async (t) => {
  const redirects = await parseRedirects('proxy_signing_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/api/*',
      to: 'https://api.example.com/:splat',
      status: 200,
      proxy: true,
      force: true,
      signed: 'API_SECRET',
    },
  ])
})

test('absolute redirects with country condition', async (t) => {
  const redirects = await parseRedirects('absolute_country_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      host: 'ximble.com.au',
      scheme: 'http',
      path: '/*',
      to: 'https://www.ximble.com/au/:splat',
      status: 301,
      force: true,
      conditions: { Country: 'au' },
    },
  ])
})

test('redirect role conditions', async (t) => {
  const redirects = await parseRedirects('role_condition_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/admin/*',
      to: '/admin/:splat',
      status: 200,
      conditions: { Role: 'admin' },
    },
  ])
})

test('redirect with multiple roles', async (t) => {
  const redirects = await parseRedirects('multiple_roles_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/member/*',
      to: '/member/:splat',
      status: 200,
      conditions: { Role: 'admin,member' },
    },
  ])
})

test('parse forward rule', async (t) => {
  const redirects = await parseRedirects('path_forward_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/admin/*',
      to: '/admin/:splat',
      status: 200,
    },
    {
      ...DEFAULT_REDIRECT,
      path: '/admin/*',
      to: '/admin/:splat',
      status: 200,
      force: true,
    },
  ])
})

test('parse mistaken _headers file', async (t) => {
  await t.throwsAsync(parseRedirects('mistaken_headers'), /Missing source or destination/)
})

test('valid service destination path', async (t) => {
  const redirects = await parseRedirects('service_redirects')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
      path: '/api/*',
      to: '/.netlify/functions/:splat',
      status: 200,
    },
  ])
})
