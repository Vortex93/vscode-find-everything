import * as vscode from 'vscode';
import { globSync } from 'glob';
import { TypeScriptParser } from '../parsers/typescript.parser';
import { DartParser } from '../parsers/dart.parser';
import { JavaScriptParser } from '../parsers/javascript.parser';
import { PythonParser } from '../parsers/python.parser';
import { BaseParser } from '../parsers/base.parser';
import { Function, Language } from '../models/function.model';
import { Logger } from '../utils/logger';

export class FunctionFinderService {
  private parsers: Map<Language, BaseParser> = new Map();
  private cache: Map<string, Function[]> = new Map();
  private logger: Logger;

  constructor(private context: vscode.ExtensionContext) {
    this.logger = new Logger();
    this.initializeParsers();
  }

  private initializeParsers(): void {
    this.parsers.set(Language.TypeScript, new TypeScriptParser());
    this.parsers.set(Language.Dart, new DartParser());
    this.parsers.set(Language.JavaScript, new JavaScriptParser());
    this.parsers.set(Language.Python, new PythonParser());
  }

  async searchAllFunctions(workspacePath?: string): Promise<Function[]> {
    try {
      const basePath = workspacePath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
      
      if (!basePath) {
        vscode.window.showErrorMessage('No workspace folder found');
        return [];
      }

      const allFunctions: Function[] = [];

      // Search for TypeScript files
      allFunctions.push(...await this.searchFunctionsByLanguage(basePath, Language.TypeScript));

      // Search for Dart files
      allFunctions.push(...await this.searchFunctionsByLanguage(basePath, Language.Dart));

      // Search for JavaScript files
      allFunctions.push(...await this.searchFunctionsByLanguage(basePath, Language.JavaScript));

      // Search for Python files
      allFunctions.push(...await this.searchFunctionsByLanguage(basePath, Language.Python));

      return allFunctions;
    } catch (error) {
      this.logger.error('Error searching functions:', error);
      vscode.window.showErrorMessage(`Error searching functions: ${error}`);
      return [];
    }
  }

  async searchFunctionsByLanguage(workspacePath: string, language: Language): Promise<Function[]> {
    const pattern = this.getFilePatternForLanguage(language);
    const files = globSync(`${workspacePath}/${pattern}`, {
      ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/out/**'],
    });

    const allFunctions: Function[] = [];
    const parser = this.parsers.get(language);

    if (!parser) {
      return [];
    }

    for (const file of files) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        const functions = parser.parse(document.getText(), file);
        allFunctions.push(...functions);
      } catch (error) {
        this.logger.warn(`Error parsing file ${file}:`, error);
      }
    }

    return allFunctions;
  }

  async searchFunctionsInFile(filePath: string): Promise<Function[]> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const language = this.detectLanguage(filePath);
      const parser = this.parsers.get(language);

      if (!parser) {
        return [];
      }

      return parser.parse(document.getText(), filePath);
    } catch (error) {
      this.logger.error(`Error searching functions in ${filePath}:`, error);
      return [];
    }
  }

  private getFilePatternForLanguage(language: Language): string {
    switch (language) {
      case Language.TypeScript:
        return '**/*.ts';
      case Language.Dart:
        return '**/*.dart';
      case Language.JavaScript:
        return '**/*.js';
      case Language.Python:
        return '**/*.py';
      default:
        return '**/*';
    }
  }

  private detectLanguage(filePath: string): Language {
    if (filePath.endsWith('.ts')) return Language.TypeScript;
    if (filePath.endsWith('.dart')) return Language.Dart;
    if (filePath.endsWith('.js')) return Language.JavaScript;
    if (filePath.endsWith('.py')) return Language.Python;
    return Language.TypeScript;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
