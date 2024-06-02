import fs from 'fs/promises';
import { Flags, ux } from '@oclif/core';
import axios from 'axios';
import chalk from 'chalk';
import inquirer from 'inquirer';
import open from 'open';
import { Issuer, errors } from 'openid-client';
import { BaseCommand } from '../base';
import { isDev } from '../helpers';

const CONFIGU_API_URL = process.env.CONFIGU_API_URL ?? (isDev ? 'http://localhost:8080' : 'https://api.configu.com');
const CONFIGU_APP_URL = process.env.CONFIGU_APP_URL ?? (isDev ? 'http://localhost:3000' : 'https://app.configu.com');
const AUTH0_DOMAIN = 'configu.us.auth0.com';
/* cspell:disable-next-line */
const AUTH0_CLIENT_ID = 'qxv0WQpwqApo4BNEYMMb4rfn1Xam9A4D';
const AUTH0_API_IDENTIFIER = 'https://api.configu.com';
const SETUP_ERROR_MESSAGE = `Initial setup in not completed. Go to ${CONFIGU_APP_URL} activate your user and create your first organization`;

export default class Login extends BaseCommand<typeof Login> {
  static description = `Initiate interactive login session to Configu \`ConfigStore\``;

  static examples = [`<%= config.bin %> <%= command.id %>`];

  static flags = {
    endpoint: Flags.string({
      hidden: true,
      default: CONFIGU_API_URL,
      env: 'CONFIGU_API_URL',
    }),
  };

  private async getDataUser(token: string) {
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
  }

  private async loginWithAuth0() {
    try {
      const auth0 = await Issuer.discover(`https://${AUTH0_DOMAIN}`);
      const client = new auth0.Client({
        client_id: AUTH0_CLIENT_ID,
        token_endpoint_auth_method: 'none',
        id_token_signed_response_alg: 'RS256',
      });

      const handle = await client.deviceAuthorization({ audience: AUTH0_API_IDENTIFIER });
      const { user_code: userCode, verification_uri_complete: verificationUriComplete, expires_in: expiresIn } = handle;

      await ux.anykey(
        `${chalk.bold('Press any key')} to open up the browser to login or press ctrl-c to abort.
  You should see the following code: ${chalk.bold(userCode)}. It expires in ${
    expiresIn % 60 === 0 ? `${expiresIn / 60} minutes` : `${expiresIn} seconds`
  }.`,
      );
      await open(verificationUriComplete);

      const tokens = await handle.poll();

      if (!tokens?.access_token) {
        throw new Error('no access token');
      }

      const userDataResponse = await this.getDataUser(tokens?.access_token);

      const choices = userDataResponse?.data?.orgs.map((org: any) => ({ name: org.name, value: org._id }));
      const { orgId } = await inquirer.prompt<{ orgId: string }>([
        {
          type: 'list',
          name: 'orgId',
          message: 'Select default organization',
          choices,
        },
      ]);

      return { org: orgId, token: tokens.access_token, type: 'Bearer' } as const;
    } catch (error) {
      switch (error.error) {
        case 'access_denied': {
          // end-user declined the device confirmation prompt, consent or rules failed
          throw new Error('\n\ncancelled interaction');
        }
        case 'expired_token': {
          // end-user did not complete the interaction in time
          throw new Error('\n\ndevice flow expired');
        }
        default: {
          if (error instanceof errors.OPError) {
            throw new TypeError(`\n\nerror = ${error.error}; error_description = ${error.error_description}`);
          }
          throw error;
        }
      }
    }
  }

  public async run(): Promise<void> {
    const credentials = await this.loginWithAuth0();
    this.config.configu.data = {
      credentials,
      endpoint: this.flags.endpoint,
    };
    const rawConfiguConfigData = JSON.stringify(this.config.configu.data);
    await fs.writeFile(this.config.configu.file, rawConfiguConfigData);
  }
}
