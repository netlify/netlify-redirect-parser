const test = require('ava')
const { each } = require('test-each')

const { parseRedirectsFormat } = require('..')

const { FIXTURES_DIR, normalizeRedirect } = require('./helpers/main')

const parseRedirects = async function (fixtureName) {
  return await parseRedirectsFormat(`${FIXTURES_DIR}/redirects_file/${fixtureName}`)
}

each(
  [
    {
      title: 'empty',
      output: [],
    },
    {
      title: 'non_existing',
      output: [],
    },
    {
      title: 'empty_line',
      output: [
        { path: '/blog/my-post.php', to: '/blog/my-post' },
        { path: '/blog/my-post-two.php', to: '/blog/my-post-two' },
      ],
    },
    {
      title: 'multiple_lines',
      output: [
        { path: '/10thmagnitude', to: 'http://www.10thmagnitude.com/', status: 301 },
        { path: '/bananastand', to: 'http://eepurl.com/Lgde5', status: 301 },
      ],
    },
    {
      title: 'line_trim',
      output: [{ path: '/home', to: '/' }],
    },
    {
      title: 'comment_full',
      output: [{ path: '/blog/my-post.php', to: '/blog/my-post' }],
    },
    {
      title: 'comment_inline',
      output: [{ path: '/blog/my-post.php', to: '/blog/my-post' }],
    },
    {
      title: 'from_simple',
      output: [{ path: '/home', to: '/' }],
    },
    {
      title: 'from_absolute_uri',
      output: [{ host: 'hello.bitballoon.com', scheme: 'http', path: '/*', to: 'http://www.hello.com/:splat' }],
    },
    {
      title: 'query',
      output: [
        { path: '/', to: '/news', query: { page: 'news' } },
        { path: '/blog', to: '/blog/:post_id', query: { post: ':post_id' } },
        { path: '/', to: '/about', query: { _escaped_fragment_: '/about' } },
      ],
    },
    {
      title: 'to_anchor',
      output: [{ path: '/blog/my-post-ads.php', to: '/blog/my-post#ads' }],
    },
    {
      title: 'to_splat_no_force',
      output: [{ path: '/*', to: 'https://www.bitballoon.com/:splat', status: 301 }],
    },
    {
      title: 'to_splat_force',
      output: [{ path: '/*', to: 'https://www.bitballoon.com/:splat', status: 301, force: true }],
    },
    {
      title: 'to_path_forward',
      output: [
        { path: '/admin/*', to: '/admin/:splat', status: 200 },
        { path: '/admin/*', to: '/admin/:splat', status: 200, force: true },
      ],
    },
    {
      title: 'proxy',
      output: [{ path: '/api/*', to: 'https://api.bitballoon.com/*', status: 200, proxy: true }],
    },
    {
      title: 'status',
      output: [{ path: '/test', to: 'https://www.bitballoon.com/test=hello', status: 301 }],
    },
    {
      title: 'status_force',
      output: [{ path: '/test', to: 'https://www.bitballoon.com/test=hello', status: 301, force: true }],
    },
    {
      title: 'conditions_country',
      output: [{ path: '/', to: '/china', status: 302, conditions: { Country: 'ch,tw' } }],
    },
    {
      title: 'conditions_country_language',
      output: [{ path: '/', to: '/china', status: 302, conditions: { Country: 'il', Language: 'en' } }],
    },
    {
      title: 'conditions_role',
      output: [{ path: '/admin/*', to: '/admin/:splat', status: 200, conditions: { Role: 'admin' } }],
    },
    {
      title: 'conditions_roles',
      output: [{ path: '/member/*', to: '/member/:splat', status: 200, conditions: { Role: 'admin,member' } }],
    },
    {
      title: 'conditions_query',
      output: [
        {
          path: '/donate',
          to: '/donate/usa?source=:source&email=:email',
          status: 302,
          query: { source: ':source', email: ':email' },
          conditions: { Country: 'us' },
        },
      ],
    },
    {
      title: 'signed',
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
      title: 'signed_backward_compat',
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
  ],
  ({ title }, { fixtureName = title, output }) => {
    test(`Parses _redirects | ${title}`, async (t) => {
      t.deepEqual(await parseRedirects(fixtureName), output.map(normalizeRedirect))
    })
  },
)

each(
  [
    { title: 'invalid_url', errorMessage: /Invalid URL/ },
    { title: 'invalid_dot_netlify_url', errorMessage: /must not start/ },
    { title: 'invalid_dot_netlify_path', errorMessage: /must not start/ },
    { title: 'invalid_no_to_no_status', errorMessage: /Missing destination/ },
    { title: 'invalid_no_to_status', errorMessage: /Missing "to" field/ },
    { title: 'invalid_mistaken_headers', errorMessage: /Missing destination/ },
  ],
  ({ title }, { fixtureName = title, errorMessage }) => {
    test(`Validate syntax errors | ${title}`, async (t) => {
      await t.throwsAsync(parseRedirects(fixtureName), errorMessage)
    })
  },
)
