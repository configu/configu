import { Expression, ExpressionObject, ExpressionContext } from './Expression';

export class Template {
  private static delimiters = [
    { start: '{{', end: '}}' },
    { start: '${', end: '}' },
    { start: '<%', end: '%>' },
  ];

  private static pattern = new RegExp(
    Template.delimiters
      .map(({ start, end }) => `${Template.escapeRegex(start)}(.*?)${Template.escapeRegex(end)}`)
      .join('|'),
    'g',
  );

  private static escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static parse(template: string) {
    const expressions: ExpressionObject[] = [];
    template.replace(Template.pattern, (match, g1, g2, g3) => {
      const expression = g1 || g2 || g3;
      const parsedExpression = Expression.parse(expression);
      expressions.push(parsedExpression);
      return expression;
    });

    const references = expressions.flatMap((expression) => expression.references());
    return {
      template,
      expressions,
      references,
    };
  }

  static render({ template, context = {} }: { template: string; context: ExpressionContext }) {
    return template.replace(Template.pattern, (match, g1, g2, g3) => {
      const expression = g1 || g2 || g3;
      return Expression.eval({ expression, context });
    });
  }
}
