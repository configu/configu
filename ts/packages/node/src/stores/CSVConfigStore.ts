/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-restricted-syntax */
import * as fs from 'fs';
import { promisify } from 'util';
import csvParser from 'csv-parser';
import { KeyValueConfigStore } from '@configu/ts';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export class CSVConfigStore extends KeyValueConfigStore {
  filePath: string;

  constructor(filePath: string) {
    super('csv');
    this.filePath = filePath;
  }

  protected async getByKey(key: string): Promise<string> {
    const rows = await this.readCSV();
    const row = rows.find((r) => r.key === key);
    return row ? row.value : '';
  }

  protected async upsert(key: string, value: string): Promise<void> {
    const rows = await this.readCSV();
    const existingRow = rows.find((r) => r.key === key);
    if (existingRow) {
      existingRow.value = value;
    } else {
      rows.push({ key, value });
    }
    await this.writeCSV(rows);
  }

  protected async delete(key: string): Promise<void> {
    const rows = await this.readCSV();
    const index = rows.findIndex((r) => r.key === key);
    if (index !== -1) {
      rows.splice(index, 1);
    }
    await this.writeCSV(rows);
  }

  private async readCSV(): Promise<{ key: string; value: string }[]> {
    try {
      const rows: { key: string; value: string }[] = [];
      const stream = fs.createReadStream(this.filePath).pipe(csvParser());

      for await (const row of stream) {
        rows.push(row);
      }

      return rows;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File does not exist yet, return an empty array
        return [];
      }
      throw error;
    }
  }

  private async writeCSV(rows: { key: string; value: string }[]): Promise<void> {
    const csvString = rows.map((row) => `${row.key},${row.value}\n`).join('');
    await writeFile(this.filePath, csvString, 'utf8');
  }
}
