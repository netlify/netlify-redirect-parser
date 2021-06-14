const test = require('ava')
const { each } = require('test-each')

const { parseFileRedirects, normalizeRedirects } = require('..')

const { FIXTURES_DIR, normalizeRedirect } = require('./helpers/main')

const parseRedirects = async function (fixtureName) {
  const redirects = await parseFileRedirects(`${FIXTURES_DIR}/redirects_file/${fixtureName}`)
  return normalizeRedirects(redirects)
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
        {
          origin: '/blog/my-post.php',
          path: '/blog/my-post.php',
          destination: '/blog/my-post',
        },
        {
          origin: '/blog/my-post-two.php',
          path: '/blog/my-post-two.php',
          destination: '/blog/my-post-two',
        },
      ],
    },
    {
      title: 'multiple_lines',
      output: [
        {
          origin: '/10thmagnitude',
          path: '/10thmagnitude',
          destination: 'http://www.10thmagnitude.com/',
          status: 301,
        },
        {
          origin: '/bananastand',
          path: '/bananastand',
          destination: 'http://eepurl.com/Lgde5',
          status: 301,
        },
      ],
    },
    {
      title: 'line_trim',
      output: [
        {
          origin: '/home',
          path: '/home',
          destination: '/',
        },
      ],
    },
    {
      title: 'comment_full',
      output: [
        {
          origin: '/blog/my-post.php',
          path: '/blog/my-post.php',
          destination: '/blog/my-post',
        },
      ],
    },
    {
      title: 'comment_inline',
      output: [
        {
          origin: '/blog/my-post.php',
          path: '/blog/my-post.php',
          destination: '/blog/my-post',
        },
      ],
    },
    {
      title: 'from_simple',
      output: [
        {
          origin: '/home',
          path: '/home',
          destination: '/',
        },
      ],
    },
    {
      title: 'from_absolute_uri',
      output: [
        {
          origin: 'http://hello.bitballoon.com/*',
          scheme: 'http',
          host: 'hello.bitballoon.com',
          path: '/*',
          destination: 'http://www.hello.com/:splat',
        },
      ],
    },
    {
      title: 'query',
      output: [
        {
          origin: '/',
          path: '/',
          destination: '/news',
          query: { page: 'news' },
        },
        {
          origin: '/blog',
          path: '/blog',
          destination: '/blog/:post_id',
          query: { post: ':post_id' },
        },
        {
          origin: '/',
          path: '/',
          destination: '/about',
          query: { _escaped_fragment_: '/about' },
        },
      ],
    },
    {
      title: 'to_anchor',
      output: [
        {
          origin: '/blog/my-post-ads.php',
          path: '/blog/my-post-ads.php',
          destination: '/blog/my-post#ads',
        },
      ],
    },
    {
      title: 'to_splat_no_force',
      output: [
        {
          origin: '/*',
          path: '/*',
          destination: 'https://www.bitballoon.com/:splat',
          status: 301,
        },
      ],
    },
    {
      title: 'to_splat_force',
      output: [
        {
          origin: '/*',
          path: '/*',
          destination: 'https://www.bitballoon.com/:splat',
          status: 301,
          force: true,
        },
      ],
    },
    {
      title: 'to_path_forward',
      output: [
        {
          origin: '/admin/*',
          path: '/admin/*',
          destination: '/admin/:splat',
          status: 200,
        },
        {
          origin: '/admin/*',
          path: '/admin/*',
          destination: '/admin/:splat',
          status: 200,
          force: true,
        },
      ],
    },
    {
      title: 'proxy',
      output: [
        {
          origin: '/api/*',
          path: '/api/*',
          destination: 'https://api.bitballoon.com/*',
          status: 200,
          proxy: true,
        },
      ],
    },
    {
      title: 'status',
      output: [
        {
          origin: '/test',
          path: '/test',
          destination: 'https://www.bitballoon.com/test=hello',
          status: 301,
        },
      ],
    },
    {
      title: 'status_force',
      output: [
        {
          origin: '/test',
          path: '/test',
          destination: 'https://www.bitballoon.com/test=hello',
          status: 301,
          force: true,
        },
      ],
    },
    {
      title: 'conditions_country',
      output: [
        {
          origin: '/',
          path: '/',
          destination: '/china',
          status: 302,
          conditions: { Country: 'ch,tw' },
        },
      ],
    },
    {
      title: 'conditions_country_language',
      output: [
        {
          origin: '/',
          path: '/',
          destination: '/china',
          status: 302,
          conditions: { Country: 'il', Language: 'en' },
        },
      ],
    },
    {
      title: 'conditions_role',
      output: [
        {
          origin: '/admin/*',
          path: '/admin/*',
          destination: '/admin/:splat',
          status: 200,
          conditions: { Role: 'admin' },
        },
      ],
    },
    {
      title: 'conditions_roles',
      output: [
        {
          origin: '/member/*',
          path: '/member/*',
          destination: '/member/:splat',
          status: 200,
          conditions: { Role: 'admin,member' },
        },
      ],
    },
    {
      title: 'conditions_query',
      output: [
        {
          origin: '/donate',
          path: '/donate',
          destination: '/donate/usa?source=:source&email=:email',
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
          origin: '/api/*',
          path: '/api/*',
          destination: 'https://api.example.com/:splat',
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
          origin: '/api/*',
          path: '/api/*',
          destination: 'https://api.example.com/:splat',
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
    { title: 'invalid_no_to_query', errorMessage: /must start with/ },
    { title: 'invalid_no_slash', errorMessage: /must start with/ },
    { title: 'invalid_mistaken_headers', errorMessage: /Missing destination/ },
  ],
  ({ title }, { fixtureName = title, errorMessage }) => {
    test(`Validate syntax errors | ${title}`, async (t) => {
      await t.throwsAsync(parseRedirects(fixtureName), errorMessage)
    })
  },
)
