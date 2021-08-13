const test = require('ava')
const { each } = require('test-each')

const { parseFileRedirects, normalizeRedirects } = require('..')

const { FIXTURES_DIR, normalizeRedirect } = require('./helpers/main')

const parseRedirects = async function (fixtureName) {
  const { redirects, errors: parseErrors } = await parseFileRedirects(`${FIXTURES_DIR}/redirects_file/${fixtureName}`)
  const { redirects: normalizedRedirects, errors: normalizeErrors } = normalizeRedirects(redirects)
  return { redirects: normalizedRedirects, errors: [...parseErrors, ...normalizeErrors] }
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
          from: '/blog/my-post.php',
          path: '/blog/my-post.php',
          to: '/blog/my-post',
        },
        {
          from: '/blog/my-post-two.php',
          path: '/blog/my-post-two.php',
          to: '/blog/my-post-two',
        },
      ],
    },
    {
      title: 'multiple_lines',
      output: [
        {
          from: '/10thmagnitude',
          path: '/10thmagnitude',
          to: 'http://www.10thmagnitude.com/',
          status: 301,
        },
        {
          from: '/bananastand',
          path: '/bananastand',
          to: 'http://eepurl.com/Lgde5',
          status: 301,
        },
      ],
    },
    {
      title: 'line_trim',
      output: [
        {
          from: '/home',
          path: '/home',
          to: '/',
        },
      ],
    },
    {
      title: 'comment_full',
      output: [
        {
          from: '/blog/my-post.php',
          path: '/blog/my-post.php',
          to: '/blog/my-post',
        },
      ],
    },
    {
      title: 'comment_inline',
      output: [
        {
          from: '/blog/my-post.php',
          path: '/blog/my-post.php',
          to: '/blog/my-post',
        },
      ],
    },
    {
      title: 'from_simple',
      output: [
        {
          from: '/home',
          path: '/home',
          to: '/',
        },
      ],
    },
    {
      title: 'from_absolute_uri',
      output: [
        {
          from: 'http://hello.bitballoon.com/*',
          scheme: 'http',
          host: 'hello.bitballoon.com',
          path: '/*',
          to: 'http://www.hello.com/:splat',
        },
      ],
    },
    {
      title: 'query',
      output: [
        {
          from: '/',
          path: '/',
          to: '/news',
          query: { page: 'news' },
        },
        {
          from: '/blog',
          path: '/blog',
          to: '/blog/:post_id',
          query: { post: ':post_id' },
        },
        {
          from: '/',
          path: '/',
          to: '/about',
          query: { _escaped_fragment_: '/about' },
        },
      ],
    },
    {
      title: 'to_anchor',
      output: [
        {
          from: '/blog/my-post-ads.php',
          path: '/blog/my-post-ads.php',
          to: '/blog/my-post#ads',
        },
      ],
    },
    {
      title: 'to_splat_no_force',
      output: [
        {
          from: '/*',
          path: '/*',
          to: 'https://www.bitballoon.com/:splat',
          status: 301,
        },
      ],
    },
    {
      title: 'to_splat_force',
      output: [
        {
          from: '/*',
          path: '/*',
          to: 'https://www.bitballoon.com/:splat',
          status: 301,
          force: true,
        },
      ],
    },
    {
      title: 'to_path_forward',
      output: [
        {
          from: '/admin/*',
          path: '/admin/*',
          to: '/admin/:splat',
          status: 200,
        },
        {
          from: '/admin/*',
          path: '/admin/*',
          to: '/admin/:splat',
          status: 200,
          force: true,
        },
      ],
    },
    {
      title: 'proxy',
      output: [
        {
          from: '/api/*',
          path: '/api/*',
          to: 'https://api.bitballoon.com/*',
          status: 200,
          proxy: true,
        },
      ],
    },
    {
      title: 'status',
      output: [
        {
          from: '/test',
          path: '/test',
          to: 'https://www.bitballoon.com/test=hello',
          status: 301,
        },
      ],
    },
    {
      title: 'status_force',
      output: [
        {
          from: '/test',
          path: '/test',
          to: 'https://www.bitballoon.com/test=hello',
          status: 301,
          force: true,
        },
      ],
    },
    {
      title: 'conditions_country',
      output: [
        {
          from: '/',
          path: '/',
          to: '/china',
          status: 302,
          conditions: { country: ['ch', 'tw'] },
        },
      ],
    },
    {
      title: 'conditions_country_language',
      output: [
        {
          from: '/',
          path: '/',
          to: '/china',
          status: 302,
          conditions: { country: ['il'], language: ['en'] },
        },
      ],
    },
    {
      title: 'conditions_role',
      output: [
        {
          from: '/admin/*',
          path: '/admin/*',
          to: '/admin/:splat',
          status: 200,
          conditions: { role: ['admin'] },
        },
      ],
    },
    {
      title: 'conditions_roles',
      output: [
        {
          from: '/member/*',
          path: '/member/*',
          to: '/member/:splat',
          status: 200,
          conditions: { role: ['admin', 'member'] },
        },
      ],
    },
    {
      title: 'conditions_query',
      output: [
        {
          from: '/donate',
          path: '/donate',
          to: '/donate/usa?source=:source&email=:email',
          status: 302,
          query: { source: ':source', email: ':email' },
          conditions: { country: ['us'] },
        },
      ],
    },
    {
      title: 'conditions_country_case',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          status: 200,
          conditions: { country: ['US'] },
        },
      ],
    },
    {
      title: 'conditions_language_case',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          status: 200,
          conditions: { language: ['en'] },
        },
      ],
    },
    {
      title: 'conditions_role_case',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          status: 200,
          conditions: { role: ['admin'] },
        },
      ],
    },
    {
      title: 'signed',
      output: [
        {
          from: '/api/*',
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
          from: '/api/*',
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
      const { redirects, errors } = await parseRedirects(fixtureName)
      t.is(errors.length, 0)
      t.deepEqual(redirects, output.map(normalizeRedirect))
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
      const { redirects, errors } = await parseRedirects(fixtureName)
      t.is(redirects.length, 0)
      // eslint-disable-next-line max-nested-callbacks
      t.true(errors.some((error) => errorMessage.test(error.message)))
    })
  },
)
