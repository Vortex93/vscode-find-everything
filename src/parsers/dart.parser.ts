import { BaseParser } from './base.parser';
import { Function, Language } from '../models/function.model';

export class DartParser extends BaseParser {
  parse(content: string, filePath: string): Function[] {
    const functions: Function[] = [];

    // Find classes
    const classPattern = /(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/g;
    let classMatch;
    while ((classMatch = classPattern.exec(content)) !== null) {
      const name = classMatch[1];
      const line = this.extractLineNumber(content, classMatch[0]);
      const column = this.extractColumnNumber(content, classMatch[0]);
      const fn = this.createFunction(name, line, column, classMatch[0].trim(), filePath, 'class');
      functions.push(fn);
    }

    // Regex pattern for Dart functions
    // Matches: returnType functionName(params) { } or functionName(params) { }
    const functionPattern = /^\s*(?<async>async\s+)?(?<returnType>[\w<>?,\s]+\s+)?(?<name>\w+)\s*\(\s*(?<params>[^)]*)\s*\)\s*(?:async\s+)?(?:=>|{)/gm;

    let match;
    while ((match = functionPattern.exec(content)) !== null) {
      const { name, params = '', returnType, async } = match.groups || {};
      
      // Skip if it's a class/type name (heuristic)
      if (this.isLikelyClassName(name)) {
        continue;
      }

      const line = this.extractLineNumber(content, match[0]);
      const column = this.extractColumnNumber(content, match[0]);
      const parameters = this.parseParameters(params);
      const isAsync = !!async;

      const fn = this.createFunction(
        name,
        line,
        column,
        match[0].trim(),
        filePath,
        'function',
        parameters,
        returnType ? returnType.trim() : 'void',
        isAsync,
        false
      );
      functions.push(fn);
    }

    return functions;
  }

  private parseParameters(paramsStr: string): any[] {
    if (!paramsStr.trim()) return [];

    const parameters = [];
    const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);

    for (const param of params) {
      // Handle Dart named and positional parameters
      const isNamed = param.includes('{') || param.includes('}');
      const cleanParam = param.replace(/[{}]/g, '').trim();
      
      const parts = cleanParam.split(/[\s:]+/);
      const name = parts[parts.length - 1];
      const type = parts.length > 1 ? parts.slice(0, -1).join(' ') : 'dynamic';

      parameters.push({
        name,
        type,
        optional: param.includes('?'),
      });
    }

    return parameters;
  }

  private isLikelyClassName(name: string): boolean {
    // Heuristic: class names usually start with uppercase
    return /^[A-Z]/.test(name);
  }

  getLanguage(): Language {
    return Language.Dart;
  }
}
