/* eslint node/no-unsupported-features: ["warn", {version: 4}] */
/* eslint no-inline-comments: "off" */
/* eslint-env es6 */
/* globals jasmine */

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000
const _ = require('lodash')
const assert = require('yeoman-assert')
const helpers = require('yeoman-test')
const path = require('path')

describe('apiproxy:app', () => {
  beforeEach(() => {
    jest.mock('generator-license/app', () => {
      const helpers = require('yeoman-test')
      return helpers.createDummyGenerator()
    })

    jest.mock('../../generators/jsc', () => {
      const helpers = require('yeoman-test')
      return helpers.createDummyGenerator()
    })

    jest.mock('git-remote-origin-url', () => {
      return () => Promise.resolve('ssh://git@onestash.verizon.com:7999/caov/vzatwork.git')
    })
  })

  afterAll(() => {
    jest.clearAllMocks()
    jest.unmock('generator-license/app')
    jest.unmock('../../generators/jsc')
    jest.unmock('git-remote-origin-url')
  })

  describe('when generating a new project,', () => {
    path.basename = jest.fn(() => 'generator-apiproxy')

    it('scaffolds a complete directory structure', () => {
      const answers = {
        name: 'generator-apiproxy',
        description: 'A node generator',
        homepage: 'http://yeoman.io',
        originUrl: 'ssh://git@onestash.verizon.com:7999/caov/vzatwork.git',
        authorName: 'The Yeoman Team',
        authorEmail: 'hi@yeoman.io',
        authorUrl: 'http://yeoman.io',
        keywords: ['foo', 'bar'],
        includeCoveralls: true
      }
      return helpers.run(require.resolve('../../generators/app'))
        .withPrompts(answers)
        .then(() => {
          assert.file([
            '.travis.yml',
            '.editorconfig',
            '.gitignore',
            '.gitattributes',
            'README.md'
          ])

          assert.file('package.json')
          assert.jsonFileContent('package.json', {
            name: 'generator-apiproxy',
            version: '0.0.0',
            description: answers.description,
            homepage: answers.homepage,
            repository: 'ssh://git@onestash.verizon.com:7999/caov/vzatwork.git',
            author: {
              name: answers.authorName,
              email: answers.authorEmail,
              url: answers.authorUrl
            },
            files: ['lib'],
            keywords: answers.keywords,
            main: 'lib/index.js'
          })

          assert.file('README.md')
          assert.fileContent('README.md', 'const generatorApiproxy = require(\'generator-apiproxy\');')
          assert.fileContent('README.md', '> A node generator')
          assert.fileContent('README.md', '$ npm install --save generator-apiproxy')
          assert.fileContent('README.md', '© [The Yeoman Team](http://yeoman.io)')
          assert.fileContent('README.md', '[travis-image]: https://travis-ci.org/')
          assert.fileContent('README.md', 'coveralls')
          assert.fileContent('.travis.yml', '| coveralls')
        })
    })
  })

  describe('when running on an existing project,', () => {
    beforeEach(() => {
      jest.mock('git-remote-origin-url', () => {
        return () => Promise.reject(new Error('fatal: no git remote'))
      })
    })
    it('keeps the current README and extends package.json attributes', (done) => {
      const pkg = {
        version: '1.0.34',
        description: 'lots of fun',
        homepage: 'http://yeoman.io',
        repository: {
          url: 'yeoman/generator-node'
        },
        author: 'The Yeoman Team',
        files: ['lib'],
        keywords: ['bar']
      }
      return helpers.run(require.resolve('../../generators/app'))
        .withPrompts({name: 'generator-node'})
        .on('ready', (gen) => {
          // eslint scanjs-rules/call_write: "warn"
          gen.fs.writeJSON(gen.destinationPath('package.json'), pkg)
          // eslint scanjs-rules/call_write: "warn"
          gen.fs.write(gen.destinationPath('README.md'), 'foo')
        })
        .then(() => {
          const newPkg = _.extend({name: 'generator-node'}, pkg)
          assert.jsonFileContent('package.json', newPkg)
          assert.fileContent('README.md', 'foo')

          done()
        })
    })

    it('keeps existing author {object} attributes', (done) => {
      const pkg = {
        version: '1.1.11',
        name: null,
        description: 'lots of fun',
        homepage: 'http://yeoman.io',
        repository: 'yeoman/generator-node',
        author: {
          name: 'No Body',
          email: 'nobody@elsewhere.net',
          url: 'https://nobody.elsewhere.net'
        },
        files: ['lib'],
        keywords: null
      }
      return helpers.run(require.resolve('../../generators/app'))
        .withPrompts({
          name: 'foo-lib'
        })
        .withOptions({
          name: 'foo-lib'
        })
        .on('ready', (gen) => {
          // eslint scanjs-rules/call_write: "warn"
          gen.fs.writeJSON(gen.destinationPath('package.json'), pkg)
          // eslint scanjs-rules/call_write: "warn"
          gen.fs.write(gen.destinationPath('README.md'), 'foo')
        })
        .then(() => {
          const newPkg = _.extend({name: 'generator-node'}, pkg)
          assert.jsonFileContent('package.json', newPkg)
          assert.fileContent('README.md', 'foo')

          done()
        })
    })

    it('runs sub-generators based on answers', (done) => {
      const answers = {
        name: 'noop',
        description: 'A node generator',
        homepage: 'http://yeoman.io',
        originUrl: 'yeoman',
        license: undefined,
        authorName: 'The Yeoman Team',
        authorEmail: 'hi@yeoman.io',
        authorUrl: 'http://yeoman.io',
        keywords: undefined, // Prompt for keywords
        includeCoveralls: false, // Do not include Coveralls
        jsc: true, // Run Javascript callout sub-generator
        boilerplate: false // Do not run boilerplate sub-generator
      }

      return helpers.run(require.resolve('../../generators/app'))
        .withPrompts(answers)
        .withOptions({
          jsc: true
        })
        .then(() => {
          const newPkg = _.extend({}, {license: null})
          assert.jsonFileContent('package.json', newPkg)
          assert.fileContent('README.md', 'noop')

          done()
        })
    })
  })

  describe('when a github user cannot be identified,', () => {
    it('prompts for a github username/organization', (done) => {
      return helpers.run(require.resolve('../../generators/app'))
        .withOptions({originUrl: 'gregswindle'})
        .then(() => {
          assert.file('.git/config')

          done()
        })
    })
  })

  describe('when given the CLI option (i.e., "flag")', () => {
    // boilerplate (Boolean, default true) include or not the boilerplate files
    // (lib/index.js, test/index.js).
    describe('--no-boilerplate', () => {
      it('skips boilerplate directory and file creation', (done) => {
        return helpers.run(require.resolve('../../generators/app'))
          .withOptions({boilerplate: false})
          .then(() => {
            assert.noFile('.assets/README.md')

            done()
          })
      })
    })

    // cli (Boolean, default false) include or not a lib/cli.js file.

    // editorconfig (Boolean, default true) include or not a .editorconfig file.
    describe('--no-editorconfig', () => {
      it('does not create an .editorconfig file', (done) => {
        return helpers.run(require.resolve('../../generators/app'))
          .withOptions({editorconfig: false})
          .then(() => {
            assert.noFile('.editorconfig')

            done()
          })
      })
    })

    // git (Boolean, default true) include or not the git files
    // (.gitattributes, .gitignore).
    describe('--no-git', () => {
      it('skips git repository initialization', (done) => {
        return helpers.run(require.resolve('../../generators/app'))
          .withOptions({git: false})
          .then(() => {
            assert.noFile('.gitattributes')
            assert.noFile('.gitignore')
            done()
          })
      })
    })
    // originUrl (String) Account name for GitHub repo location.

    // license (Boolean, default true) include or not a LICENSE file.
    describe('--no-license', () => {
      it('skips prompts for and creation of a software license', () => {
        return helpers.run(require.resolve('../../generators/app'))
          .withOptions({license: false})
          .then(() => assert.noFile('LICENSE'))
      })
    })

    // readme (String) content of the README.md file. Given this option,
    // generator-node will still generate the title (with badges) and the
    // license section.

    // travis (Boolean, default true) include or not a .travis.yml file.
    describe('--no-travis', () => {
      it('skips .travis.yml', (done) => {
        return helpers.run(require.resolve('../../generators/app'))
          .withOptions({travis: false})
          .then(() => {
            assert.noFile('.travis.yml')

            done()
          })
      })
    })
  })
})
