import { type Cfgu } from '@configu/ts';

export const GET_STARTED: { [key: string]: Cfgu } = {
  GREETING: {
    type: 'RegEx',
    pattern: '^(hello|hey|welcome|hola|salute|bonjour|shalom|marhabaan)$',
    default: 'hello',
  },
  SUBJECT: { type: 'String', default: 'world' },
  MESSAGE: {
    type: 'String',
    template: '{{GREETING}}, {{SUBJECT}}!',
    description: 'Generates a full greeting message',
  },
};
