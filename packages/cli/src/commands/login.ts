import { Command, Option } from 'clipanion';
import { Issuer, errors } from 'openid-client';
import { log, isCancel, cancel, confirm, select } from '@clack/prompts';
import open from 'open';
import { configuPlatformApi, CONFIGU_DEFAULT_API_URL, CONFIGU_DEFAULT_APP_URL } from '@configu/common';
import { BaseCommand } from './base';

const AUTH0_DOMAIN = 'configu.us.auth0.com';
/* cspell:disable-next-line */
const AUTH0_CLIENT_ID = 'qxv0WQpwqApo4BNEYMMb4rfn1Xam9A4D';
const AUTH0_API_IDENTIFIER = 'https://api.configu.com';
const SETUP_ERROR_MESSAGE = `Initial setup in not completed. Go to ${CONFIGU_DEFAULT_APP_URL} activate your user and create your first organization`;

export class LoginCommand extends BaseCommand {
  static override paths = [['login']];

  static override usage = Command.Usage({
    description: `Initiate interactive login session to Configu \`ConfigStore\``,
  });

  // endpoint = Option.String('--endpoint', {
  //   env: 'CONFIGU_API_URL',
  //   hidden: true,
  // });

  private async getDataUser(token: string) {
    try {
      const user = await configuPlatformApi({
        method: 'GET',
        url: '/user',
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

      const confirmLogin = await confirm({
        message: `Press any key to open up the browser to login or press ctrl-c to abort.
        You should see the following code: ${userCode}. It expires in ${
          expiresIn % 60 === 0 ? `${expiresIn / 60} minutes` : `${expiresIn} seconds`
        }. Continue?`,
        initialValue: true,
      });

      if (isCancel(confirmLogin) || !confirmLogin) {
        return null;
      }

      await open(verificationUriComplete);

      const tokens = await handle.poll();

      if (!tokens?.access_token) {
        throw new Error('no access token');
      }

      const userDataResponse = await this.getDataUser(tokens?.access_token);

      const current = (
        this.context.configu.local.contents.stores?.configu?.configuration?.credentials as { org?: string }
      )?.org;
      const options = userDataResponse?.data?.orgs.map((org: any) => ({
        label: org.name,
        value: org._id,
        hint: org._id === current ? 'current' : '',
      }));
      const orgId = await select({ message: 'Select an organization', options });

      if (isCancel(orgId)) {
        return null;
      }

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

  async execute() {
    await this.init();

    const credentials = await this.loginWithAuth0();
    if (!credentials) {
      return;
    }

    await this.context.configu.local.save({
      stores: {
        configu: { type: 'configu-platform', configuration: { credentials, endpoint: CONFIGU_DEFAULT_API_URL } },
      },
    });
  }
}
