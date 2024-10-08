import _ from 'lodash';
import {
  Expression as AdaptiveExpressions,
  ExpressionEvaluator,
  ReturnType,
  FunctionUtils,
} from 'adaptive-expressions';

export type ExpressionString = string;
export type ExpressionObject = AdaptiveExpressions;
export type ExpressionReturnType = ReturnType;
export type ExpressionFunction<P extends any[] = any[], R = any> = (...args: P) => R;

export class Expression {
  static functions = AdaptiveExpressions.functions;
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

  static register<P extends any[] = any[], R = any>({ key, fn }: { key: string; fn: ExpressionFunction<P, R> }) {
    AdaptiveExpressions.functions.add(
      key,
      new ExpressionEvaluator(key, (expr, state, options) => {
        console.log('Expression:', expr.toString());
        console.log('State:', state);

        let value: any;

        const arg0 = state.getValue('_');

        const { args, error: childrenError } = FunctionUtils.evaluateChildren(expr, state, options);
        let error = childrenError;

        if (error) {
          return { value, error };
        }

        try {
          if (arg0 && arg0 !== args[0]) {
            args.unshift(arg0);
          }
          value = fn(...(args as P));
        } catch (e) {
          error = e;
        }

        return { value, error };
      }),
    );
  }

  static parse(expression: string): ExpressionObject {
    try {
      const expressionToParse = expression.replace(Expression.pattern, (match, group) => {
        return `${Expression.marker.start}${group}${Expression.marker.end}`;
      });
      const expressionObject = AdaptiveExpressions.parse(expressionToParse);
      return expressionObject;
    } catch (error) {
      throw new Error(`Failed to parse expression "${expression}"\n${error}`);
    }
  }

  static sort(expressionsDict: Record<string, string>): string[] {
    // Initialize templates to references graph
    const graph: Record<string, string[]> = _.chain(expressionsDict)
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

// Expression.register({
//   key: 'isInt',
//   fn: (str: string, opts: object) => {
//     console.log(str, opts);
//     return true;
//   },
// });

// const expression = 'isInt({ gt: 5 })';
// const context = { $: { value: '6' }, _: '6' };

// try {
//   const exp = Expression.parse(expression);
//   // console.log(exp);
//   // console.log(exp.returnType, exp.toString());

//   const res = exp.tryEvaluate(context);
//   console.log(res, typeof res.value);
// } catch (error) {
//   console.error('Error:', error);
// }

// eslint-disable-next-line no-template-curly-in-string
// const x = 15;
// eslint-disable-next-line no-useless-concat, no-template-curly-in-string, no-useless-escape, prettier/prettier
// const exp = `${ExpressionAntlrParser.STRING_INTERPOLATION_START}\${x + 5}${ExpressionAntlrParser.STRING_INTERPOLATION_START}`;
// // const exp = 'x > 5 ? `lg-${x + ${x}}` : `lt-${x}`';
// // const exp = 'stringOrValue("${x + 5}" ${x > 5 ? \\`lg-${15}\\` : \\`lt-${15}\\`}")';

// const expr = "`${x > 5 ? `lg-${x + 5}` : `lt-${x}`}`";

// // const res = Expression.parse('\\`${x+5} ${x > 5 ? \\`lg-${x}\\` : \\`lt-${x}\\`}\\`').tryEvaluate({ x: 15 });

// const res = Expression.parse(exp).tryEvaluate({ x: 15 });

// // const res = new StringExpression(exp).toExpression().tryEvaluate({ x: 15 });
// console.log(res);

// // const x = new StringExpressionConverter();

// // console.log(str);

// function safeEval(expression: string, context: Record<string, any> = {}): any {
//   const contextKeys = Object.keys(context);
//   const contextValues = Object.values(context);

//   const functionBody = `
//     "use strict";
//     return (${expression});
//   `;

//   const func = new Function(...contextKeys, functionBody);
//   return func(...contextValues);
// }

// // Example usage
// const expression = 'x + 5';
// const context = { x: 15 };
// const result = safeEval(expression, context);
// console.log(result); // Output: 20

// Shadow
