export abstract class BaseMongoConfigStore {
  abstract get(key: string): Promise<string | undefined>;
  abstract set(key: string, value: string): Promise<void>;
}
