import configu_proxy
from configu_proxy.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://0.0.0.0:3000
# See configuration.py for a list of all supported configuration parameters.
configuration = configu_proxy.Configuration(
    host = "http://0.0.0.0:3000"
)

# Enter a context with an instance of the API client
with configu_proxy.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = configu_proxy.DefaultApi(api_client)
    post_request = configu_proxy.PostRequest(
        store='csv',
        set='/dev',
        schema={
          "name": "my-schema",
          "contents": {
            "GREETING": {
              "type": "RegEx",
              "pattern": "^(hello|hey|welcome|hola|salute|bonjour|shalom|marhabaan)$",
              "default": "hello"
            },
            "SUBJECT": {
              "type": "String",
              "default": "world"
            },
            "MESSAGE": {
              "type": "String",
              "template": "{{GREETING}}, {{SUBJECT}}!",
              "description": "Generates a full greeting message"
            }
          }
        }) # PostRequest |

    try:
        api_response = api_instance.root_post(post_request)
        print("The response of DefaultApi->root_post:\n")
        pprint(api_response)
    except ApiException as e:
        print("Exception when calling DefaultApi->root_post: %s\n" % e)
