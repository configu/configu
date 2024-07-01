/* eslint-disable */
const Configu = require('../sdk/javascript');

const api = new Configu.DefaultApi();
const postRequest = new Configu.PostRequest('csv', '/dev', {
  name: 'my-schema',
  contents: {
    GREETING: {
      type: 'RegEx',
      pattern: '^(hello|hey|welcome|hola|salute|bonjour|shalom|marhabaan)$',
      default: 'hello',
    },
    SUBJECT: {
      type: 'String',
      default: 'world',
    },
    MESSAGE: {
      type: 'String',
      template: '{{GREETING}}, {{SUBJECT}}!',
      description: 'Generates a full greeting message',
    },
  },
}); // {PostRequest}
const callback = function (error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log(`API called successfully. Returned data: ${JSON.stringify(data, null, 2)}`);
  }
};
api.rootPost(postRequest, callback);
