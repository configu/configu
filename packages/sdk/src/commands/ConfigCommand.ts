import packageJson from '../../package.json' with { type: 'json' };

export type ConfigCommandInput<I extends object> = I;

export type ConfigCommandOutput<O extends object> = {
  result: O;
  metadata: { version: string; start: number; end: number; duration: number };
};

export abstract class ConfigCommand<I extends object, O extends object> {
  constructor(public input: I) {}
  abstract execute(): Promise<O>;

  async run(): Promise<ConfigCommandOutput<O>> {
    const start = performance.now();
    const result = await this.execute();
    const end = performance.now();
    const duration = end - start;

    return {
      metadata: { version: packageJson.version, start, end, duration },
      result,
    };
  }
}
