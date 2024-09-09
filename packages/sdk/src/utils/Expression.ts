import { ExpressionParser, Expression as AdaptiveExpressions } from 'adaptive-expressions';
import validator from 'validator';

export type ExpressionObject = AdaptiveExpressions;
export type ExpressionContext = Record<string, unknown>;

export class Expression {
  static parse(expression: string): ExpressionObject {
    try {
      const parser = new ExpressionParser();
      AdaptiveExpressions.functions.add('isInt', (...args) => validator.isInt(...args));
      return parser.parse(expression);
    } catch (error) {
      throw new Error(`Failed to parse expression: ${expression}`);
    }
  }

  static eval({ expression, context = {} }: { expression: string; context: ExpressionContext }) {
    const { value, error } = this.parse(expression).tryEvaluate(context);
    if (error) {
      return '';
    }
    return value !== undefined ? value : '';
  }
}
