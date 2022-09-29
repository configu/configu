import { CliUx } from '@oclif/core';
import axios from 'axios';
import chalk from 'chalk';
import { prompt } from 'inquirer';
import { Issuer, errors } from 'openid-client';
import { ConfiguStore } from '@configu/node';
import { ProtocolToInit } from './types';

const CONFIGU_DEFAULT_ENDPOINT = 'https://api.configu.com';
const AUTH0_DOMAIN = 'configu.us.auth0.com';
const AUTH0_CLIENT_ID = 'qxv0WQpwqApo4BNEYMMb4rfn1Xam9A4D';
const AUTH0_API_IDENTIFIER = CONFIGU_DEFAULT_ENDPOINT;
const SETUP_ERROR_MESSAGE = 'initial setup in not completed';

const getDataUser = async (endpoint: string, token: string) => {
  try {
    const user = await axios({
      method: 'GET',
      baseURL: endpoint,
      url: '/user',
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!user?.data?.orgs.length) {
      throw new Error(SETUP_ERROR_MESSAGE);
    }
    return user;
  } catch (error) {
    if (error?.response?.status === 404) {
      throw new Error(SETUP_ERROR_MESSAGE);
    }
    // * in case of network error
    throw error;
  }
};

const loginWithAuth0 = async (endpoint: string) => {
  try {
    const auth0 = await Issuer.discover(`https://${AUTH0_DOMAIN}`);
    const client = new auth0.Client({
      client_id: AUTH0_CLIENT_ID,
      token_endpoint_auth_method: 'none',
      id_token_signed_response_alg: 'RS256',
    });

    const handle = await client.deviceAuthorization({ audience: AUTH0_API_IDENTIFIER });
    const { user_code: userCode, verification_uri_complete: verificationUriComplete, expires_in: expiresIn } = handle;

    await CliUx.ux.anykey(
      `${chalk.bold('press any key')} to open up the browser to login or press ctrl-c to abort.
you should see the following code: ${chalk.bold(userCode)}. it expires in ${
        expiresIn % 60 === 0 ? `${expiresIn / 60} minutes` : `${expiresIn} seconds`
      }.`,
    );
    await CliUx.ux.open(verificationUriComplete);

    const tokens = await handle.poll();

    if (!tokens?.access_token) {
      throw new Error('no access token');
    }

    const userDataResponse = await getDataUser(endpoint, tokens?.access_token);

    const choices = userDataResponse?.data?.orgs.map((org: any) => ({ name: org.name, value: org._id }));
    const { orgId } = await prompt<{ orgId: string }>([
      {
        name: 'orgId',
        message: 'select organization',
        type: 'list',
        choices,
      },
    ]);

    return { org: orgId, token: tokens.access_token, type: 'Bearer' } as const;
  } catch (error) {
    switch (error.error) {
      case 'access_denied': // end-user declined the device confirmation prompt, consent or rules failed
        throw new Error('\n\ncancelled interaction');
      case 'expired_token': // end-user did not complete the interaction in time
        throw new Error('\n\ndevice flow expired');
      default:
        if (error instanceof errors.OPError) {
          throw new TypeError(`\n\nerror = ${error.error}; error_description = ${error.error_description}`);
        }
        throw error;
    }
  }
};

export const ConfiguStorePTI: ProtocolToInit = {
  [ConfiguStore.protocol]: async (url) => {
    const source = 'cli';
    const endpoint = url.searchParams.get('endpoint') ?? CONFIGU_DEFAULT_ENDPOINT;
    const type = (url.searchParams.get('type') as 'Token' | 'Bearer' | null) ?? 'Token';

    // * configu://-[?endpoint=]
    if (url.hostname === '-') {
      const { CONFIGU_ORG, CONFIGU_TOKEN } = process.env;

      if (CONFIGU_ORG && CONFIGU_TOKEN) {
        return {
          url: `${ConfiguStore.protocol}://${CONFIGU_TOKEN}@${CONFIGU_ORG}?endpoint=${endpoint}`,
          store: new ConfiguStore({
            credentials: { org: CONFIGU_ORG, token: CONFIGU_TOKEN, type: 'Token' },
            source,
            endpoint,
          }),
        };
      }

      const credentials = await loginWithAuth0(endpoint);
      return {
        url: `${ConfiguStore.protocol}://${credentials.token}@${credentials.org}?endpoint=${endpoint}&type=Bearer`,
        store: new ConfiguStore({
          credentials,
          source,
          endpoint,
        }),
      };
    }

    // * configu://token@org[?endpoint=]
    return {
      url: url.href,
      store: new ConfiguStore({
        credentials: { org: url.hostname, token: url.username, type },
        source,
        endpoint,
      }),
    };
  },
};
