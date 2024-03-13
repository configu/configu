import _ from 'lodash';
import { ConfiguConfigStore } from '..';

describe(`ConfiguConfigStore`, () => {
  describe(`constructor`, () => {
    it(`sets client header Authorization`, () => {
      const store = new ConfiguConfigStore({
        credentials: {
          org: 'test',
          token:
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im5JcTY3WlI4cmpqaDc4Y3ltU2hUbyJ9.eyJodHRwczovL2NvbmZpZ3UuY29tL3VzZXJfaWQiOiJhdXRoMHw2MDhhODIyNjMyMDNmNzAwNmRlMjI3NmYiLCJodHRwczovL2NvbmZpZ3UuY29tL2VtYWlsIjoicmFuQGNvbmZpZ3UuY29tIiwiaHR0cHM6Ly9jb25maWd1LmNvbS9uYW1lIjoiUmFuIENvaGVuIiwiaHR0cHM6Ly9jb25maWd1LmNvbS9sb2dpbnNfY291bnQiOjEzNiwiaHR0cHM6Ly9jb25maWd1LmNvbS9jb3VudHJ5X2NvZGUiOiJJTCIsImh0dHBzOi8vY29uZmlndS5jb20vdGltZV96b25lIjoiQXNpYS9KZXJ1c2FsZW0iLCJpc3MiOiJodHRwczovL2NvbmZpZ3UudXMuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDYwOGE4MjI2MzIwM2Y3MDA2ZGUyMjc2ZiIsImF1ZCI6WyJodHRwczovL2FwaS5jb25maWd1LmNvbSIsImh0dHBzOi8vY29uZmlndS51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjcxMTM4NDg5LCJleHAiOjE2NzEyMjQ4ODksImF6cCI6InF4djBXUXB3cUFwbzRCTkVZTU1iNHJmbjFYYW05QTREIiwic2NvcGUiOiJvcGVuaWQifQ.hBpges-tVVMWLknTvX1fUuuiEMmTV5yxEQRsCFlXucHR4TgF7B-4EchFX-YTIxpBMsNAJHUoFdqjETWUkPkCKuGasMF3CQweI_vOM_BkAe03kMVOzHASmHyco6huAa6Ac0R9xy7ujBxCwMQBFbvkRRhLCh5wwap3Vfg7UJULJajiPdLdoj7oZM6I8Ie7ORpqozMbkSxEMvHRp38o_KMb4LzWZBPidH251IbrqbWGg9S3DvWV3_waVXTMnTXDb0BaAU6wrRwbfG9jxHHuyFgyHhkhppS8_OcY2eaPoo9AEaZhwW41Htrxth5sADB6jWGnpnCJ-FGnOnnx4WYsq5tWuQ',
        },
        source: 'test',
      });

      const { headers } = store['client'].defaults;
      expect((headers as any).Org).toBe('test');
      expect((headers as any).Source).toBe('test');
      expect(typeof headers.common.Token).toBe('undefined');
      expect(typeof headers.common.Authorization).toBe('string');
      expect(String(headers.common.Authorization).startsWith('Bearer')).toBe(true);
    });
    it(`sets client header Token`, () => {
      const store = new ConfiguConfigStore({
        credentials: {
          org: 'test',
          token: _.repeat('t', 40),
        },
        source: 'test',
      });

      const { headers } = store['client'].defaults;
      expect(typeof headers.common.Token).toBe('string');
      expect(typeof headers.common.Authorization).toBe('undefined');
    });
    it(`sets the tag property if provided`, () => {
      const store = new ConfiguConfigStore({
        credentials: {
          org: 'test',
          token: 'test-token',
        },
        source: 'test',
        tag: 'test-tag',
      });

      expect(store['tag']).toBe('test-tag');
    });
    it(`does not set the tag property if not provided`, () => {
      const store = new ConfiguConfigStore({
        credentials: {
          org: 'test',
          token: 'test-token',
        },
        source: 'test',
      });

      expect(store['tag']).toBeUndefined();
    });
  });
});
