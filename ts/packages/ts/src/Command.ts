export abstract class Command<T> {
  constructor(public parameters: Record<string, unknown>) {}
  abstract run(): Promise<{ data: T }>;
}
