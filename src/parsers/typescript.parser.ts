import { BaseParser } from './base.parser';
import { Function, Language } from '../models/function.model';

export class TypeScriptParser extends BaseParser {
  parse(content: string, filePath: string): Function[] {
    const functions: Function[] = [];
    
    // Find classes first
    const classPattern = /(?<exported>export\s+)?(?<abstract>abstract\s+)?class\s+(?<name>\w+)(?:\s+extends\s+(?<extends>\w+))?(?:\s+implements\s+(?<implements>[\w,\s]+))?\s*\{/gm;
    let match;
    while ((match = classPattern.exec(content)) !== null) {
      const { name, exported, abstract: isAbstract } = match.groups || {};
      const line = this.extractLineNumber(content, match[0]);
      const column = this.extractColumnNumber(content, match[0]);
      
      functions.push({
        name,
        type: 'class',
        language: this.getLanguage(),
        file: filePath,
        line,
        column,
        signature: match[0].trim(),
        parameters: [],
        returnType: '',
        isAsync: false,
        isExported: !!exported,
        docComment: isAbstract ? 'abstract' : undefined
      });
    }
    
    // Regex patterns for TypeScript functions
    const functionPatterns = [
      // Function declarations: function name(...) { }
      /^(?<exported>export\s+)?(?<async>async\s+)?function\s+(?<name>\w+)\s*\(\s*(?<params>[^)]*)\s*\)\s*(?::\s*(?<returnType>[\w<>[\],\s|&]+))?\s*\{/gm,
      // Arrow functions: const name = (...) => { }
      /(?<exported>export\s+)?const\s+(?<name>\w+)\s*=\s*(?<async>async\s*)?\(\s*(?<params>[^)]*)\s*\)\s*(?::\s*(?<returnType>[\w<>[\],\s|&]+))?\s*=>/gm,
      // Class methods: methodName(...) { }
      /^\s*(?<async>async\s+)?(?<name>\w+)\s*\(\s*(?<params>[^)]*)\s*\)\s*(?::\s*(?<returnType>[\w<>[\],\s|&]+))?\s*\{/gm,
    ];

    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const { name, params = '', returnType = 'void', async, exported } = match.groups || {};
        
        const line = this.extractLineNumber(content, match[0]);
        const column = this.extractColumnNumber(content, match[0]);
        const parameters = this.parseParameters(params);
        const isAsync = !!async;
        const isExported = !!exported;

        const fn = this.createFunction(
          name,
          line,
          column,
          match[0].trim(),
          filePath,
          'function',
          parameters,
          returnType.trim(),
          isAsync,
          isExported
        );
        functions.push(fn);
      }
    }

    return functions;
  }

  private parseParameters(paramsStr: string): any[] {
    if (!paramsStr.trim()) return [];
    
    const parameters = [];
    // Simple parameter parsing - can be enhanced
    const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);
    
    for (const param of params) {
      const [name, type] = param.split(':').map(p => p.trim());
      parameters.push({
        name: name.replace(/[?=].+/, '').trim(),
        type: type ? type.split('=')[0].trim() : 'any',
        optional: param.includes('?'),
        defaultValue: param.includes('=') ? param.split('=')[1].trim() : undefined,
      });
    }

    return parameters;
  }

  getLanguage(): Language {
    return Language.TypeScript;
  }
}
