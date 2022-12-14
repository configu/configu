import _ from 'lodash';
import { CliUx } from '@oclif/core';
import axios from 'axios';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Issuer, errors } from 'openid-client';
import { defaultInteractiveSession } from './default';

const CONFIGU_API_URL =
  process.env.CONFIGU_API_URL ??
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://api.configu.com');
const AUTH0_DOMAIN = 'configu.us.auth0.com';
const AUTH0_CLIENT_ID = 'qxv0WQpwqApo4BNEYMMb4rfn1Xam9A4D';
const AUTH0_API_IDENTIFIER = CONFIGU_API_URL;
const SETUP_ERROR_MESSAGE = 'initial setup in not completed';

const getDataUser = async (token: string) => {
  try {
    const user = await axios({
      method: 'GET',
      baseURL: CONFIGU_API_URL,
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

const loginWithAuth0 = async () => {
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

    const userDataResponse = await getDataUser(tokens?.access_token);

    const choices = userDataResponse?.data?.orgs.map((org: any) => ({ name: org.name, value: org._id }));
    const { orgId } = await inquirer.prompt<{ orgId: string }>([
      {
        type: 'list',
        name: 'orgId',
        message: 'select organization',
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

export const configuInteractiveSession = async () => {
  const { type } = await inquirer.prompt<{ type: 'User' | 'Token' }>([
    {
      name: 'type',
      message: 'select authentication type',
      type: 'list',
      choices: ['User', 'Token'],
    },
  ]);
  if (type === 'Token') {
    const storeConfiguration = await defaultInteractiveSession('configu', ['type']);
    return { ...storeConfiguration, type: 'Token' } as const;
  }
  return loginWithAuth0();
};
