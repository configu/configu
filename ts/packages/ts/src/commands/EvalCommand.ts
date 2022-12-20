import _ from 'lodash';
import { Command } from '../Command';
import { Config, Cfgu } from '../types';
import { ERR, TMPL } from '../utils';
import { ConfigStore } from '../ConfigStore';
import { ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';

export type EvaluatedConfigs = { [key: string]: string };
export type EvaluatedConfigsArray = { key: string; value: string }[];

export type EvalCommandParameters = {
  store: ConfigStore | ConfigStore[];
  set: ConfigSet;
  schema: ConfigSchema | ConfigSchema[];
};

export type EvalCommandReturn = EvaluatedConfigs;

export class EvalCommand extends Command<EvalCommandReturn> {
  constructor(public parameters: EvalCommandParameters) {
    super(parameters);
  }

  async run() {
    const { store, set, schema } = this.parameters;
    const warn: string[] = [];

    const stores = Array.isArray(store) ? store : [store];
    await Promise.all(stores.map((storeInstance) => storeInstance.init()));

    const schemas = Array.isArray(schema) ? schema : [schema];
    const schemaContentsPromises = schemas.map((sch) => ConfigSchema.parse(sch));
    const schemaContentsArray = await Promise.all(schemaContentsPromises);

    const storeQuery = schemaContentsArray.flatMap((schemaContents, idx) => {
      const currentSchema = schemas[idx];
      return _(schemaContents)
        .keys()
        .flatMap((key) => {
          return set.hierarchy.map((sh) => ({ set: sh, schema: currentSchema.uid, key }));
        })
        .value();
    });
    const storedConfigs = await stores[0].get(storeQuery);

    // * removed duplicate fetched configs according to set hierarchy and schemas rtl
    const storedConfigsDict = _(storedConfigs)
      .orderBy(
        [(config) => set.hierarchy.indexOf(config.set), (config) => _.map(schemas, 'name').indexOf(config.schema)],
        ['desc', 'desc'],
      )
      .uniqBy((config) => `${config.schema}.${config.key}`)
      .keyBy((config) => config.key)
      .value();

    // * removed duplicate keys according to schemas rtl
    const schemaContentsDict = _(schemaContentsArray).reduce<{ [key: string]: Cfgu }>(
      (dict, curr) => ({ ...dict, ...curr }),
      {},
    );

    const templateKeys: string[] = [];
    const evaluatedConfigsPromises = _(schemaContentsDict)
      .entries()
      .map<Promise<EvaluatedConfigsArray[number]>>(async ([key, cfgu]) => {
        if (cfgu.template) {
          templateKeys.push(key);
          return { key, value: '' };
        }

        const storedConfig = storedConfigsDict[key] as Config | undefined;
        if (storedConfig?.value) {
          const referenceValue = ConfigStore.extractReferenceValue(storedConfig.value);
          if (!referenceValue) {
            return { key, value: storedConfig.value };
          }

          const referenceData = ConfigStore.parseReferenceValue(referenceValue);
          if (!referenceData) {
            // * couldn't extract reference data from current reference value (reference is not stored correctly)
            // * the code shouldn't get here if the reference was added via the upsert command
            warn.push(`failed to parse reference value "${storedConfig.value}" for key "${key}"`);
            return { key, value: '' };
          }
          const referencedStores = stores.filter((s, i) => i !== 0 && s.type === referenceData.store);
          if (_.isEmpty(referencedStores)) {
            // * the store required to eval the current reference value was not provided via parameters
            warn.push(
              `missing required store "${referenceData.store}" to eval reference value "${storedConfig.value}" for key "${key}"`,
            );
            return { key, value: '' };
          }

          const referencedValues = await Promise.all(referencedStores.map((s) => s.get([referenceData.query])));
          const evaluatedReferencedValue =
            _(referencedValues)
              .reverse()
              .find((v) => Boolean(v?.[0]?.value))?.[0]?.value ?? ''; // todo: refactor to something nicer then that
          if (!evaluatedReferencedValue) {
            warn.push(
              `failed to get reference value "${storedConfig.value}" for key "${key}" from store "${referenceData.store}"`,
            );
          }
          return { key, value: evaluatedReferencedValue };
        }

        if (cfgu.default) {
          return { key, value: cfgu.default };
        }

        // * config wasn't found for the current key in the provided set hierarchy
        warn.push(`failed to find a config for key "${key}" in the provided set hierarchy "${set.path}"`);
        return { key, value: '' };
      })
      .value();

    const evaluatedConfigsArr = await Promise.all(evaluatedConfigsPromises);
    const evaluatedConfigsDict = _(evaluatedConfigsArr).keyBy('key').mapValues('value').value();

    // * evaluate templates until done with all of them or can't render (e.g. because of reference loop etc..)
    let runAgain = true;
    while (!_.isEmpty(templateKeys) && runAgain) {
      let hasRendered = false;
      _(templateKeys)
        .cloneDeep()
        .forEach((key) => {
          const template = schemaContentsDict[key].template as string;
          const expressions = TMPL.parse(template);
          if (expressions.some((exp) => templateKeys.includes(exp.key))) {
            return;
          }
          evaluatedConfigsDict[key] = TMPL.render(template, evaluatedConfigsDict);
          _.pull(templateKeys, key);
          hasRendered = true;
        });
      runAgain = hasRendered;
    }
    if (!_.isEmpty(templateKeys)) {
      warn.push(`failed to render template of keys "${templateKeys.join(', ')}", check for reference loop`);
    }

    // * validate the eval result against the provided schemas
    _(schemaContentsDict)
      .entries()
      .forEach(async ([key, cfgu]) => {
        const evaluatedValue = evaluatedConfigsDict[key];

        if (!ConfigSchema.validateValueType({ ...cfgu, value: evaluatedValue })) {
          throw new Error(
            ERR(`invalid value type for key "${key}"`, {
              location: [`EvalCommand`, 'run'],
              suggestion: `value "${evaluatedValue}" must be a "${cfgu.type}"`,
            }),
          );
        }

        if (cfgu.required && !evaluatedValue) {
          throw new Error(ERR(`required key "${key}" is missing a value`, { location: [`EvalCommand`, 'run'] }));
        }

        if (evaluatedValue && cfgu.depends && cfgu.depends.some((depend) => !evaluatedConfigsDict[depend])) {
          throw new Error(
            ERR(`one or more depends of key "${key}" is missing a value`, { location: [`EvalCommand`, 'run'] }),
          );
        }
      });

    return { data: evaluatedConfigsDict as EvaluatedConfigs, warn };
  }
}
