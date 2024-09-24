import _ from 'lodash';
import { Expression as AdaptiveExpressions, ReturnType } from 'adaptive-expressions';

export type ExpressionString = string;
export type ExpressionReturnType = ReturnType;
export type ExpressionObject = AdaptiveExpressions;
export type ExpressionContext = Record<string, unknown>;

export class Expression {
  private static marker = { start: '${', end: '}' };
  private static delimiters = [
    { start: '{{', end: '}}' },
    { start: '<%', end: '%>' },
  ];

  private static escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private static pattern = new RegExp(
    Expression.delimiters
      .map(({ start, end }) => `${Expression.escapeRegex(start)}(.*?)${Expression.escapeRegex(end)}`)
      .join('|'),
    'g',
  );

  static parse(expression: string): ExpressionObject {
    try {
      const expressionToParse = expression.replace(Expression.pattern, (match, group) => {
        return `${Expression.marker.start}${group}${Expression.marker.end}`;
      });
      return AdaptiveExpressions.parse(expressionToParse);
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

  static sort(expressionsDict: Record<string, string>): string[] {
    // Initialize templates to references graph
    const graph: Record<string, string[]> = _(expressionsDict)
      .mapValues((template) => Expression.parse(template).references())
      .value();

    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    // Helper function for DFS
    const visit = (node: string, ancestors: string[] = []) => {
      if (visiting.has(node)) {
        throw new Error(`Cyclic dependency detected: ${ancestors.join(' -> ')} -> ${node}`);
      }

      if (!visited.has(node)) {
        visiting.add(node);

        (graph[node] || []).forEach((neighbor) => {
          visit(neighbor, [...ancestors, node]);
        });

        visiting.delete(node);
        visited.add(node);
        sorted.push(node);
      }
    };

    // Perform DFS for each node
    _.forEach(graph, (referances, key) => {
      if (!visited.has(key)) {
        visit(key);
      }
    });

    // Filter sorted to include only the initial template keys
    return sorted.filter((key) => Object.prototype.hasOwnProperty.call(expressionsDict, key));
  }
}
