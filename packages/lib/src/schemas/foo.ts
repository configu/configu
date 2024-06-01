import { type Cfgu } from '@configu/ts';

export const FOO: { [key: string]: Cfgu } = {
  FOO: { type: 'String', default: 'foo', description: 'string example variable' },
  BAR: { type: 'RegEx', pattern: '^(foo|bar|baz)$', description: 'regex example variable' },
  BAZ: { type: 'String', template: '{{FOO}} - {{BAR}}', description: 'template example variable' },
};
