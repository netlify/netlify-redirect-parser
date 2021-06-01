const test = require('ava')
const { each } = require('test-each')

const { parseRedirectsFormat } = require('..')

const { FIXTURES_DIR, normalizeRedirect } = require('./helpers/main')

const parseRedirects = async function (fixtureName) {
  return await parseRedirectsFormat(`${FIXTURES_DIR}/${fixtureName}`)
}

each(
  [
    {
      title: 'simple_redirects',
      output: [
        { path: '/home', to: '/' },
        { path: '/blog/my-post.php', to: '/blog/my-post' },
        { path: '/blog/my-post-ads.php', to: '/blog/my-post#ads' },
        { path: '/news', to: '/blog' },
      ],
    },
    {
      title: 'status_code_redirects',
      output: [
        { path: '/home', to: '/', status: 301 },
        { path: '/my-redirect', to: '/', status: 302 },
        { path: '/pass-through', to: '/', status: 200 },
        { path: '/ecommerce', to: '/store-closed', status: 404 },
      ],
    },
    {
      title: 'parameter_match_redirects',
      output: [
        { path: '/', to: '/news', query: { page: 'news' } },
        { path: '/blog', to: '/blog/:post_id', query: { post: ':post_id' } },
        { path: '/', to: '/about', status: 301, query: { _escaped_fragment_: '/about' } },
      ],
    },
    {
      title: 'full_hostname_redirects',
      output: [{ host: 'hello.bitballoon.com', scheme: 'http', path: '/*', to: 'http://www.hello.com/:splat' }],
    },
    {
      title: 'proxy_redirects',
      output: [{ path: '/api/*', to: 'https://api.bitballoon.com/*', status: 200, proxy: true }],
    },
    {
      title: 'country_redirects',
      output: [{ path: '/', to: '/china', status: 302, conditions: { Country: 'ch,tw' } }],
    },
    {
      title: 'country_language_redirects',
      output: [{ path: '/', to: '/china', status: 302, conditions: { Country: 'il', Language: 'en' } }],
    },
    {
      title: 'splat_no_force_redirects',
      output: [{ path: '/*', to: 'https://www.bitballoon.com/:splat', status: 301 }],
    },
    {
      title: 'splat_force_redirects',
      output: [{ path: '/*', to: 'https://www.bitballoon.com/:splat', status: 301, force: true }],
    },
    {
      title: 'equal_redirects',
      output: [{ path: '/test', to: 'https://www.bitballoon.com/test=hello', status: 301 }],
    },
    {
      title: 'realworld_redirects',
      output: [
        {
          path: '/donate',
          to: '/donate/usa?source=:source&email=:email',
          status: 302,
          query: { source: ':source', email: ':email' },
          conditions: { Country: 'us' },
        },
        { path: '/', to: 'https://origin.wework.com', status: 200, proxy: true },
        { path: '/:lang/locations/*', to: '/locations/:splat', status: 200 },
      ],
    },
    {
      title: 'complex_redirects',
      output: [
        {
          path: '/google-play',
          to: 'https://goo.gl/app/playmusic?ibi=com.google.PlayMusic&isi=691797987&ius=googleplaymusic&link=https://play.google.com/music/m/Ihj4yege3lfmp3vs5yoopgxijpi?t%3DArrested_DevOps',
          status: 301,
          force: true,
        },
      ],
    },
    {
      title: 'proxy_signing_redirects',
      output: [
        {
          path: '/api/*',
          to: 'https://api.example.com/:splat',
          status: 200,
          proxy: true,
          force: true,
          signed: 'API_SECRET',
        },
      ],
    },
    {
      title: 'absolute_country_redirects',
      output: [
        {
          host: 'ximble.com.au',
          scheme: 'http',
          path: '/*',
          to: 'https://www.ximble.com/au/:splat',
          status: 301,
          force: true,
          conditions: { Country: 'au' },
        },
      ],
    },
    {
      title: 'role_condition_redirects',
      output: [{ path: '/admin/*', to: '/admin/:splat', status: 200, conditions: { Role: 'admin' } }],
    },
    {
      title: 'multiple_roles_redirects',
      output: [{ path: '/member/*', to: '/member/:splat', status: 200, conditions: { Role: 'admin,member' } }],
    },
    {
      title: 'path_forward_redirects',
      output: [
        { path: '/admin/*', to: '/admin/:splat', status: 200 },
        { path: '/admin/*', to: '/admin/:splat', status: 200, force: true },
      ],
    },
    {
      title: 'service_redirects',
      output: [{ path: '/api/*', to: '/.netlify/functions/:splat', status: 200 }],
    },
  ],
  ({ title }, { fixtureName = title, output }) => {
    test(`Parses _redirects | ${title}`, async (t) => {
      t.deepEqual(await parseRedirects(fixtureName), output.map(normalizeRedirect))
    })
  },
)

each(
  [
    { title: 'no_destination_redirects', errorMessage: /Missing destination/ },
    { title: 'redirects', errorMessage: /Missing source or destination/ },
    { title: 'mistaken_headers', errorMessage: /Missing source or destination/ },
  ],
  ({ title }, { fixtureName = title, errorMessage }) => {
    test(`Validate syntax errors | ${title}`, async (t) => {
      await t.throwsAsync(parseRedirects(fixtureName), errorMessage)
    })
  },
)

test('complicated _redirects file', async (t) => {
  const redirects = await parseRedirects('complicated_redirects')
  t.is(redirects.length, 26)
  redirects.forEach((rule) => {
    t.true(rule.to.startsWith('http'))
  })
})
