import { BaseParser } from './base.parser';
import { Function, Language } from '../models/function.model';

export class PythonParser extends BaseParser {
  parse(content: string, filePath: string): Function[] {
    const functions: Function[] = [];

    // Regex pattern for Python functions
    // Matches: def functionName(params):
    const functionPattern = /^(?<indent>\s*)def\s+(?<name>\w+)\s*\(\s*(?<params>[^)]*)\s*\)\s*(?:->[\w\[\], ]+)?\s*:/gm;

    let match;
    while ((match = functionPattern.exec(content)) !== null) {
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
          'None',
          false,
          false
        )
      );
    }

    return functions;
  }

  private parseParameters(paramsStr: string): any[] {
    if (!paramsStr.trim()) return [];

    const parameters = [];
    const params = paramsStr.split(',').map(p => p.trim()).filter(p => p && p !== 'self' && p !== 'cls');

    for (const param of params) {
      const [name, type] = param.split(':').map(p => p.trim());
      parameters.push({
        name: name.split('=')[0].trim(),
        type: type ? type.split('=')[0].trim() : 'Any',
        optional: param.includes('='),
      });
    }

    return parameters;
  }

  getLanguage(): Language {
    return Language.Python;
  }
}
