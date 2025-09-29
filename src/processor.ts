import { readFileSync, existsSync } from 'fs';
import { basename } from 'path';
import { CLIConfig, ClassificationItem } from './types';
import Papa from 'papaparse';

export class FileProcessor {
  static async processFiles(config: CLIConfig): Promise<ClassificationItem[]> {
    const items: ClassificationItem[] = [];

    for (const sourcePath of config.sources) {
      if (!existsSync(sourcePath)) {
        throw new Error(`File not found: ${sourcePath}`);
      }

      if (config.mode === 'csv') {
        const csvItems = await this.processCSV(sourcePath, config);
        items.push(...csvItems);
      } else {
        const fileItems = await this.processTextFile(sourcePath);
        items.push(...fileItems);
      }
    }

    return items;
  }

  private static async processTextFile(filePath: string): Promise<ClassificationItem[]> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const filename = basename(filePath);

      // For now, treat the entire file as one item
      // In a more advanced version, we could split by lines or paragraphs
      return [{
        id: `${filePath}:full`,
        content,
        filename,
        lineNumbers: [1], // Will be calculated properly later
        line: 0, // Files always use line 0
      }];
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  private static async processCSV(filePath: string, config: CLIConfig): Promise<ClassificationItem[]> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const filename = basename(filePath);

      const parseResult = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // Keep everything as strings
        transform: (value: string) => value.trim() // Trim whitespace from values
      });

      if (parseResult.errors.length > 0) {
        console.warn(`CSV parsing warnings for ${filePath}:`);
        parseResult.errors.forEach(error => {
          console.warn(`  Row ${error.row}: ${error.message}`);
        });
      }

      const items: ClassificationItem[] = [];

      parseResult.data.forEach((row: any, index: number) => {
        // Skip empty rows
        const hasContent = Object.values(row).some(value => value && String(value).trim());
        if (!hasContent) {
          return;
        }

        // Filter columns if specified
        let filteredRow = row;
        if (config.columns && config.columns.length > 0) {
          filteredRow = {};
          for (const col of config.columns) {
            if (row.hasOwnProperty(col)) {
              filteredRow[col] = row[col];
            } else {
              console.warn(`Column "${col}" not found in CSV. Available columns: ${Object.keys(row).join(', ')}`);
            }
          }
        }

        items.push({
          id: `${filePath}:row:${index + 1}`,
          content: this.formatCSVRowForDisplay(filteredRow),
          filename,
          csvRow: filteredRow,
          line: index + 1, // 1-based row number for CSV (matches spreadsheet conventions)
        });
      });

      console.log(`Successfully parsed ${items.length} records from ${filePath}`);
      return items;
    } catch (error) {
      throw new Error(`Failed to process CSV file ${filePath}: ${error}`);
    }
  }


  private static formatCSVRowForDisplay(row: Record<string, string>): string {
    const entries = Object.entries(row);
    const maxKeyLength = Math.max(...entries.map(([key]) => key.length));

    return entries
      .map(([key, value]) => `${key.padEnd(maxKeyLength)}: ${value}`)
      .join('\n');
  }
}