import axios from 'axios';
import { CONFIGU_DEFAULT_API_URL, CONFIGU_DEFAULT_DOMAIN } from '@configu/configu-platform';
import { debug } from './OutputStreams';

export { axios as httpClient };

export const CONFIGU_DEFAULT_FILES_URL = `https://files.${CONFIGU_DEFAULT_DOMAIN}`;
export const configuFilesApi = axios.create({
  baseURL: CONFIGU_DEFAULT_FILES_URL,
  responseType: 'text',
});

export {
  ConfiguPlatformConfigStoreApprovalQueueError,
  CONFIGU_DEFAULT_API_URL,
  CONFIGU_DEFAULT_APP_URL,
} from '@configu/configu-platform';

export const configuPlatformApi = axios.create({
  baseURL: CONFIGU_DEFAULT_API_URL,
  responseType: 'json',
});

configuPlatformApi.interceptors.request.use((config) => {
  debug('ConfiguPlatformApi request:', config.method, config.url);
  return config;
}, undefined);

configuPlatformApi.interceptors.response.use(undefined, (error) => {
  // https://axios-http.com/docs/handling_errors
  if (error?.response?.data) {
    throw new Error(error.response.data.message ?? error.response.data);
  } else if (error?.request) {
    throw new Error(
      `There seems to be a problem connecting to Configu's servers. Please check your network connection and try again.`,
    );
  } else {
    throw error;
  }
});
