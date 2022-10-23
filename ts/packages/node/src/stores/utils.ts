import _ from 'lodash';
import { StoreQuery, StoreContents } from '@configu/ts';

export const getConfigsHelper = async (
  query: StoreQuery,
  StoreIdOfConfigName: string,
  getStoreIdOfConfigMethod: { ({ set, schema }: StoreQuery[number]): string },
  fetchConfigFromStoreMethod: { (secretId: string): Promise<{ secretId: string; data: any }> },
): Promise<StoreContents> => {
  const secretsIds = _(query)
    .map((q) => getStoreIdOfConfigMethod(q))
    .uniq()
    .value();

  const secretsPromises = secretsIds.map(async (secretId) => fetchConfigFromStoreMethod(secretId));

  const secretsArray = await Promise.all(secretsPromises);
  const secrets = _(secretsArray).keyBy(StoreIdOfConfigName).mapValues('data').value();

  const storedConfigs = _(query)
    .map((q) => {
      const { set, schema, key } = q;
      const secretId = getStoreIdOfConfigMethod(q);
      const secretData = secrets[secretId];

      if (key === '*') {
        return Object.entries(secretData).map((data) => {
          return {
            set,
            schema,
            key: data[0],
            value: data[1] as any,
          };
        });
      }

      return {
        set,
        schema,
        key,
        value: secretData[key],
      };
    })
    .flatten()
    .filter('value')
    .value();

  return storedConfigs;
};
