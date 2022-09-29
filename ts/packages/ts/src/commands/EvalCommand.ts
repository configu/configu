import _ from 'lodash';
import { Command } from '../Command';
import { Config, CfguContents, StoreQuery, EvaluatedConfigs, EvaluatedConfigsArray } from '../types';
import { Store } from '../Store';
import { Set } from '../Set';
import { Cfgu } from '../Cfgu';
import { ERR, TMPL } from '../utils';

export type EvalCommandParameters = {
  store: Store | Store[];
  set: Set;
  schema: Cfgu | Cfgu[];
};

export type EvalCommandReturn = EvaluatedConfigs;

export class EvalCommand extends Command<EvalCommandReturn> {
  constructor(public parameters: EvalCommandParameters) {
    super(parameters);
  }

  async run() {
    const { store, set, schema } = this.parameters;

    const stores = Array.isArray(store) ? store : [store];
    const storeDict = _.keyBy(stores, 'protocol');

    const schemas = Array.isArray(schema) ? schema : [schema];
    const cfguContentsPromises = schemas.map((sch) => sch.parse());
    const cfguContentsArray = await Promise.all(cfguContentsPromises);

    const storeQuery = cfguContentsArray.flatMap((cfguContents, idx) => {
      const cfgu = schemas[idx];
      return _(cfguContents)
        .keys()
        .flatMap((key) => {
          return set.hierarchy.map((sh) => ({ set: sh, schema: cfgu.name, key }));
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
    const cfguContentsDict = _(cfguContentsArray).reduce<CfguContents>((dict, curr) => ({ ...dict, ...curr }), {});

    const templateKeys: string[] = [];
    const evaluatedConfigsPromises = _(cfguContentsDict)
      .entries()
      .map<Promise<EvaluatedConfigsArray[number]>>(async ([key, configSchema]) => {
        if (configSchema.template) {
          templateKeys.push(key);
          return { key, value: '' };
        }

        const storedConfig = storedConfigsDict[key] as Config | undefined;
        if (storedConfig?.value) {
          const referenceValue = Store.extractReferenceValue(storedConfig.value);
          if (!referenceValue) {
            return { key, value: storedConfig.value };
          }

          const referenceData = Store.parseReferenceValue(referenceValue);
          if (!referenceData) {
            // * couldn't extract reference data from current reference value (reference is not stored correctly)
            // * the code shouldn't get here if the reference was added via the upsert command
            return { key, value: '' };
          }
          const referencedStore = storeDict[referenceData.store];
          if (!referencedStore) {
            // * the store required to eval the current reference value was not provided via parameters
            return { key, value: '' };
          }

          const referencedValue = await referencedStore.get([referenceData] as StoreQuery);
          return { key, value: referencedValue[0].value };
        }

        if (configSchema.default) {
          return { key, value: configSchema.default };
        }

        // * config wasn't found for the current key in the provided set hierarchy
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
          const template = cfguContentsDict[key].template as string;
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

    // validate the eval result against the provided schemas
    _(cfguContentsDict)
      .entries()
      .forEach(async ([key, configSchema]) => {
        const evaluatedValue = evaluatedConfigsDict[key];

        if (!Cfgu.validateValueType({ ...configSchema, value: evaluatedValue })) {
          throw new Error(ERR(`invalid value type`, [key], `"${evaluatedValue}" must be a "${configSchema.type}"`));
        }

        if (configSchema.required && !evaluatedValue) {
          throw new Error(ERR(`required key is missing a value`, [key]));
        }

        if (
          evaluatedValue &&
          configSchema.depends &&
          configSchema.depends.some((depend) => !evaluatedConfigsDict[depend])
        ) {
          throw new Error(ERR(`depends of a key are missing a value`, [key]));
        }
      });

    return { data: evaluatedConfigsDict as EvaluatedConfigs };
  }
}
