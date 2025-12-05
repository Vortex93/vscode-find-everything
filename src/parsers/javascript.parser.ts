import { BaseParser } from './base.parser';
import { Function, Language } from '../models/function.model';

export class JavaScriptParser extends BaseParser {
  parse(content: string, filePath: string): Function[] {
    const functions: Function[] = [];

    // Regex patterns for JavaScript functions
    const functionPatterns = [
      // Function declarations: function name(...) { }
      /function\s+(?<name>\w+)\s*\(\s*(?<params>[^)]*)\s*\)\s*\{/g,
      // Arrow functions: const name = (...) => { }
      /(?:const|let|var)\s+(?<name>\w+)\s*=\s*\(\s*(?<params>[^)]*)\s*\)\s*=>/g,
      // Method shorthand: methodName(...) { }
      /^\s*(?<name>\w+)\s*\(\s*(?<params>[^)]*)\s*\)\s*\{/gm,
    ];

    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const { name, params = '' } = match.groups || {};

        const line = this.extractLineNumber(content, match[0]);
        const column = this.extractColumnNumber(content, match[0]);
        const parameters = this.parseParameters(params);

        functions.push(
          this.createFunction(
            name,
            line,
            column,
            match[0].trim(),
            filePath,
            parameters,
            'any',
            false,
            false
          )
        );
      }
    }

    return functions;
  }

  private parseParameters(paramsStr: string): any[] {
    if (!paramsStr.trim()) return [];

    const parameters = [];
    const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);

    for (const param of params) {
      const name = param.split('=')[0].split(':')[0].trim();
      parameters.push({
        name,
        type: 'any',
        optional: param.includes('='),
      });
    }

    return parameters;
  }

  getLanguage(): Language {
    return Language.JavaScript;
  }
}
