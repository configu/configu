import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import 'ses';

import { _ } from './expressions/Utils';
import { validator, JSONSchema, z } from './expressions/Validators';
import { assert, expect, should } from './expressions/Assertion';

export type ExpressionString = string;

export class ConfigExpression {
  private static globals = new Map<string, unknown>();
  private static suffix = 'Expression';
  private static marker = { start: '${', end: '}' };
  private static delimiters = [
    { start: '{{', end: '}}' },
    { start: '<%', end: '%>' },
  ];

  static {
    // todo: finalize lockdown call with proper error handling
    // lockdown({ consoleTaming: 'unsafe', errorTaming: 'unsafe', errorTrapping: 'none', stackFiltering: 'verbose' });

    // register built-in globals
    ConfigExpression.register('_', _);
    ConfigExpression.register('validator', validator);
    ConfigExpression.register('JSONSchema', JSONSchema);
    ConfigExpression.register('jsonschema', JSONSchema);
    ConfigExpression.register('z', z);
    ConfigExpression.register('assert', assert);
    ConfigExpression.register('expect', expect);
    ConfigExpression.register('should', should);
  }

  public static escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private static pattern = new RegExp(
    ConfigExpression.delimiters
      .map(({ start, end }) => `${ConfigExpression.escapeRegex(start)}(.*?)${ConfigExpression.escapeRegex(end)}`)
      .join('|'),
    'g',
  );

  static register(key: string, registeree: unknown) {
    if (key.endsWith(ConfigExpression.suffix)) {
      ConfigExpression.globals.set(key.slice(0, -ConfigExpression.suffix.length), registeree);
    } else {
      ConfigExpression.globals.set(key, registeree);
    }
  }

  private static parse(raw: ExpressionString) {
    try {
      const expression = raw.replace(ConfigExpression.pattern, (match, group) => {
        return `${ConfigExpression.marker.start}${group}${ConfigExpression.marker.end}`;
      });
      const ast = acorn.parse(expression, { ecmaVersion: 'latest' });

      return {
        raw,
        expression,
        ast,
      };
    } catch (error) {
      throw new Error(`Failed to parse expression "${raw}"\n${error}`);
    }
  }

  static evaluate(expression: ExpressionString, context: Record<string, unknown> = {}): any {
    // try {
    // console.log(expression);
    const parsed = ConfigExpression.parse(expression);
    const compartment = new Compartment({ ...context, ...Object.fromEntries(ConfigExpression.globals) });
    return compartment.evaluate(parsed.expression);
    // } catch (error) {
    //   throw new Error(`Failed to evaluate expression "${expression}"\n${error.message}`);
    // }
  }

  static evaluateBoolean(expression: ExpressionString, context: Record<string, unknown>): boolean {
    return ConfigExpression.evaluate(`Boolean(${expression})`, context);
  }

  static evaluateTemplateString(expression: ExpressionString, context: Record<string, unknown>): string {
    return ConfigExpression.evaluate(`\`${expression}\``, context);
  }

  static references(expression: ExpressionString): string[] {
    const parsed = ConfigExpression.parse(expression);
    const references: Set<string> = new Set();
    walk.simple(parsed.ast, {
      Identifier(node: acorn.Identifier) {
        references.add(node.name);
      },
    });
    return Array.from(references);
  }

  static sort(expressionsDict: Record<string, string>): string[] {
    // Initialize templates to references graph
    const graph: Record<string, string[]> = _.chain(expressionsDict)
      .mapValues((expression) => ConfigExpression.references(expression))
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
