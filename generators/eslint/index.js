const ApiProxyGenerator = require('../api-proxy-generator')
const _ = require('lodash')
const npmScriptsPkg = require('./templates/npm-scripts')
const rootPkg = require('../../package.json')

module.exports = class extends ApiProxyGenerator {
  writing () {
    const eslintDependencies = [
      'eslint',
      'eslint-config-xo-space',
      'eslint-plugin-import',
      'eslint-plugin-jest',
      'eslint-plugin-jsdoc',
      'eslint-plugin-no-unsafe-innerhtml',
      'eslint-plugin-no-unsanitized',
      'eslint-plugin-node',
      'eslint-plugin-promise',
      'eslint-plugin-scanjs-rules',
      'eslint-plugin-security',
      'eslint-plugin-standard',
      'eslint-plugin-xss'
    ]
    const devDependencies = _.pick(rootPkg.devDependencies, eslintDependencies)

    const pkgJson = {
      devDependencies,
      eslintConfig: {
        extends: 'xo-space',
        env: {
          jest: true,
          node: true
        }
      },
      scripts: npmScriptsPkg
    }

    this.fs.extendJSON(
      this.destinationPath(this.options.generateInto, 'package.json'),
      pkgJson
    )

    this.fs.copy(
      this.templatePath('eslintignore'),
      this.destinationPath(this.options.generateInto, '.eslintignore')
    )

    this.fs.copy(
      this.templatePath('eslintrc'),
      this.destinationPath(this.options.generateInto, '.eslintrc.yml')
    )
  }
}
