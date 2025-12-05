import * as vscode from 'vscode';
import { globSync } from 'glob';
import { TypeScriptParser } from '../parsers/typescript.parser';
import { DartParser } from '../parsers/dart.parser';
import { JavaScriptParser } from '../parsers/javascript.parser';
import { PythonParser } from '../parsers/python.parser';
import { GenericParser } from '../parsers/generic.parser';
import { BaseParser } from '../parsers/base.parser';
import { Function, Language } from '../models/function.model';
import { Logger } from '../utils/logger';

export class FunctionFinderService {
  private parsers: Map<Language, BaseParser> = new Map();
  private cache: Map<string, Function[]> = new Map();
  private allFunctionsCache: Function[] = [];
  private isCacheValid: boolean = false;
  private logger: Logger;
  private fileWatcher: vscode.FileSystemWatcher | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.logger = new Logger();
    this.initializeParsers();
    this.setupFileWatcher();
    this.loadCacheFromDisk();
  }

  private initializeParsers(): void {
    this.parsers.set(Language.TypeScript, new TypeScriptParser());
    this.parsers.set(Language.Dart, new DartParser());
    this.parsers.set(Language.JavaScript, new JavaScriptParser());
    this.parsers.set(Language.Python, new PythonParser());
    this.parsers.set(Language.Go, new GenericParser(Language.Go));
    this.parsers.set(Language.Java, new GenericParser(Language.Java));
    this.parsers.set(Language.Cpp, new GenericParser(Language.Cpp));
    this.parsers.set(Language.Vue, new GenericParser(Language.Vue));
  }

  private setupFileWatcher(): void {
    const pattern = '**/*.{ts,js,dart,py,go,java,cpp,c,h,hpp,cs,rb,php,swift,kt,rs,vue}';
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    
    this.fileWatcher.onDidCreate(() => this.invalidateCache());
    this.fileWatcher.onDidChange(() => this.invalidateCache());
    this.fileWatcher.onDidDelete(() => this.invalidateCache());
  }

  private invalidateCache(): void {
    this.isCacheValid = false;
    this.allFunctionsCache = [];
  }

  private async loadCacheFromDisk(): Promise<void> {
    try {
      const cacheFile = vscode.Uri.joinPath(this.context.globalStorageUri, 'functions-cache.json');
      const data = await vscode.workspace.fs.readFile(cacheFile);
      const cached = JSON.parse(data.toString());
      
      if (cached.timestamp && Date.now() - cached.timestamp < 3600000) { // 1 hour
        this.allFunctionsCache = cached.functions || [];
        this.isCacheValid = true;
        console.log('Loaded cache from disk:', this.allFunctionsCache.length, 'functions');
      }
    } catch (error) {
      console.log('No cache file found or error loading cache');
    }
  }

  private async saveCacheToDisk(): Promise<void> {
    try {
      await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
      const cacheFile = vscode.Uri.joinPath(this.context.globalStorageUri, 'functions-cache.json');
      const data = {
        timestamp: Date.now(),
        functions: this.allFunctionsCache
      };
      await vscode.workspace.fs.writeFile(cacheFile, Buffer.from(JSON.stringify(data)));
      console.log('Saved cache to disk');
    } catch (error) {
      console.log('Error saving cache:', error);
    }
  }

  async searchAllFunctions(workspacePath?: string, showProgress: boolean = false): Promise<Function[]> {
    // Return cached results if valid
    if (this.isCacheValid && this.allFunctionsCache.length > 0) {
      console.log('Using cached functions:', this.allFunctionsCache.length);
      return this.allFunctionsCache;
    }

    const indexingTask = async (progress?: vscode.Progress<{ message?: string; increment?: number }>) => {
      try {
        const basePath = workspacePath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        
        if (!basePath) {
          vscode.window.showErrorMessage('No workspace folder found');
          return [];
        }

        console.log('Building function index for workspace:', basePath);
        if (progress) progress.report({ message: 'Scanning workspace...' });
        
        const allFunctions: Function[] = [];

        // Search all languages in parallel for speed
        const languages = [
          Language.TypeScript,
          Language.JavaScript,
          Language.Python,
          Language.Dart,
          Language.Go,
          Language.Java,
          Language.Cpp,
          Language.Vue
        ];

        const results = await Promise.all(
          languages.map(async (lang, index) => {
            if (progress) progress.report({ message: `Indexing ${lang} files...`, increment: 100 / languages.length });
            return this.searchFunctionsByLanguage(basePath, lang);
          })
        );

        results.forEach((functions, index) => {
          console.log(`${languages[index]} functions found:`, functions.length);
          allFunctions.push(...functions);
        });

        console.log('Total functions indexed:', allFunctions.length);
        if (progress) progress.report({ message: 'Caching results...' });
        
        // Cache results
        this.allFunctionsCache = allFunctions;
        this.isCacheValid = true;
        await this.saveCacheToDisk();
        
        return allFunctions;
      } catch (error) {
        this.logger.error('Error searching functions:', error);
        vscode.window.showErrorMessage(`Error searching functions: ${error}`);
        return [];
      }
    };

    if (showProgress) {
      return await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Indexing workspace',
          cancellable: false,
        },
        indexingTask
      );
    } else {
      return await indexingTask();
    }
  }

  async searchFunctionsByLanguage(workspacePath: string, language: Language): Promise<Function[]> {
    const pattern = this.getFilePatternForLanguage(language);
    console.log(`Searching for ${language} files with pattern: ${workspacePath}/${pattern}`);
    
    const files = globSync(`${workspacePath}/${pattern}`, {
      ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/out/**'],
    });
    
    console.log(`Found ${files.length} ${language} files`);

    const allFunctions: Function[] = [];
    const parser = this.parsers.get(language);

    if (!parser) {
      console.log(`No parser for ${language}`);
      return [];
    }

    for (const file of files) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        const functions = parser.parse(document.getText(), file);
        console.log(`Parsed ${functions.length} functions from ${file}`);
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
      case Language.Go:
        return '**/*.go';
      case Language.Java:
        return '**/*.java';
      case Language.Cpp:
        return '**/*.{cpp,c,h,hpp}';
      case Language.Vue:
        return '**/*.vue';
      default:
        return '**/*';
    }
  }

  private detectLanguage(filePath: string): Language {
    if (filePath.endsWith('.ts')) return Language.TypeScript;
    if (filePath.endsWith('.dart')) return Language.Dart;
    if (filePath.endsWith('.js')) return Language.JavaScript;
    if (filePath.endsWith('.py')) return Language.Python;
    if (filePath.endsWith('.go')) return Language.Go;
    if (filePath.endsWith('.java')) return Language.Java;
    if (filePath.endsWith('.cpp') || filePath.endsWith('.c') || filePath.endsWith('.h') || filePath.endsWith('.hpp')) return Language.Cpp;
    if (filePath.endsWith('.vue')) return Language.Vue;
    return Language.TypeScript;
  }

  clearCache(): void {
    this.cache.clear();
    this.invalidateCache();
  }

  dispose(): void {
    this.fileWatcher?.dispose();
  }
}
