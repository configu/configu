import Mustache from 'mustache';

// const customTags = [['{{', '}}'], ['<%', '%>'], []];
Mustache.tags = ['{{', '}}'];
Mustache.escape = (text) => text;

export class TemplateEngine {
  static parse({ template }: { template: string }) {
    return Mustache.parse(template).map(([type, key, start, end]) => {
      if (!['name', 'text'].includes(type)) {
        throw new Error(`template "${template}" mustn't contain unsupported tokens`);
      }
      return {
        type: type as 'name' | 'text',
        key,
        start,
        end,
      };
    });
  }

  static render({ template, context }: { template: string; context: object }) {
    return Mustache.render(template, context);
  }
}

_.template('Hello, <%= name %>!', { escape: /^$/ });

function renderTemplate(template: string, context: Record<string, any> = {}): string {
  const pattern = /\{\{(.*?)\}\}|\$\{(.*?)\}|\<\%(.*?)\%\>/g;
  return Function(
    'context',
    `with(context) { return \`${template.replace(pattern, (_, g1, g2, g3) => {
      const expr = g1 || g2 || g3;
      return `\${${expr} ?? ''}`;
    })}\`; }`,
  )(context);
}

function renderTemplate(template: string, context: Record<string, any> = {}): string {
  const pattern = /\{\{(.*?)\}\}|\$\{(.*?)\}|\<\%(.*?)\%\>/g;
  try {
    return new Function(
      'context',
      `with(context) { return \`${template.replace(pattern, (_, g1, g2, g3) => {
        const expr = g1 || g2 || g3;
        return `\${${expr} ?? ''}`;
      })}\`; }`,
    )(context);
  } catch (error) {
    console.error('Error rendering template:', error);
    return '';
  }
}

/*
 * @param {string} textExpression - code to evaluate passed as plain text
 * @param {object} contextData - some JavaScript object
 * that can be referred to as $data in the textExpression
 * @returns {*} depend on the tagetExpression
 */
function wrappedEval(textExpression, contextData) {
  const fn = Function(`"use strict"; var $data = this;return (${textExpression})`);
  return fn.bind(contextData)();
}
