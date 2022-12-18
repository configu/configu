// import SetJTDSchema from './generated/Set.jtd.json';
// import CfguJTDSchema from './generated/Cfgu.jtd.json';
// import CfguContentsJTDSchema from './generated/CfguContents.jtd.json';
// import StoreJTDSchema from './generated/Store.jtd.json';
// import StoreContentsJTDSchema from './generated/StoreContents.jtd.json';

// export { SetJTDSchema, CfguJTDSchema, CfguContentsJTDSchema, StoreContentsJTDSchema, StoreJTDSchema };

// export { Set as ISet } from './generated/Set';

// export { CfguType, Cfgu as ICfgu } from './generated/Cfgu';
// export { ConfigSchemaType, ConfigSchema, CfguContents } from './generated/CfguContents';

// export { StoreQuery, Store as IStore } from './generated/Store';
// export { Config, StoreContents } from './generated/StoreContents';

export { Convert } from './generated';
export { Config, Cfgu, CfguType } from './generated';
export { ConfigStore as IConfigStore, ConfigStoreQuery } from './generated';
export { ConfigSet as IConfigSet } from './generated';
export { ConfigSchema as IConfigSchema, ConfigSchemaType } from './generated';

// export type EvaluatedConfigs = { [key: string]: string };
// export type EvaluatedConfigsArray = { key: string; value: string }[];
