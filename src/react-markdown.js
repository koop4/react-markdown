'use strict'

const unified = require('unified')
const parse = require('remark-parse')
const PropTypes = require('prop-types')
const objectAssign = require('object-assign')
const defaultRenderers = require('./renderers')
const getDefinitions = require('./get-definitions')
const astToReact = require('./ast-to-react')
const wrapTableRows = require('./wrap-table-rows')
const disallowNode = require('./plugins/disallow-node')
const naiveHtml = require('./plugins/naive-html')

const allTypes = Object.keys(defaultRenderers)

const ReactMarkdown = function ReactMarkdown(props) {
  const src = props.source || props.children || ''

  if (props.allowedTypes && props.disallowedTypes) {
    throw new Error('Only one of `allowedTypes` and `disallowedTypes` should be defined')
  }

  const renderers = objectAssign({}, defaultRenderers, props.renderers)

  let disallowedTypes = props.disallowedTypes || []
  if (props.allowedTypes) {
    disallowedTypes = allTypes.filter(
      type => type !== 'root' && props.allowedTypes.indexOf(type) === -1
    )
  }

  const plugins = [wrapTableRows]

  const removalMethod = props.unwrapDisallowed ? 'unwrap' : 'remove'
  if (disallowedTypes.length > 0) {
    plugins.push(disallowNode.ofType(disallowedTypes, removalMethod))
  }

  if (props.allowNode) {
    plugins.push(disallowNode.ifNotMatch(props.allowNode, removalMethod))
  }

  const renderHtml = !props.escapeHtml && !props.skipHtml
  if (renderHtml) {
    plugins.push(naiveHtml)
  }

  const rawAst = unified()
    .use(parse)
    .parse(src)

  const ast = plugins.reduce((node, plugin) => plugin(node), rawAst)
  const renderProps = objectAssign({}, props, {
    renderers: renderers,
    definitions: getDefinitions(ast)
  })

  return astToReact(ast, renderProps)
}

ReactMarkdown.defaultProps = {
  renderers: {},
  escapeHtml: true,
  skipHtml: false
}

ReactMarkdown.propTypes = {
  className: PropTypes.string,
  source: PropTypes.string,
  children: PropTypes.string,
  sourcePos: PropTypes.bool,
  escapeHtml: PropTypes.bool,
  skipHtml: PropTypes.bool,
  softBreak: PropTypes.string,
  allowNode: PropTypes.func,
  allowedTypes: PropTypes.arrayOf(PropTypes.oneOf(allTypes)),
  disallowedTypes: PropTypes.arrayOf(PropTypes.oneOf(allTypes)),
  transformLinkUri: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  transformImageUri: PropTypes.func,
  unwrapDisallowed: PropTypes.bool,
  renderers: PropTypes.object
}

module.exports = ReactMarkdown
