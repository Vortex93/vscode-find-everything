import { BaseParser } from './base.parser';
import { Function, Language } from '../models/function.model';

export class GenericParser extends BaseParser {
  private language: Language;

  constructor(language: Language) {
    super();
    this.language = language;
  }

  parse(content: string, filePath: string): Function[] {
    const functions: Function[] = [];
    
    // Generic patterns that work across many C-style languages
    const patterns = [
      // function name(...) { }
      /(?:^|\n)\s*(?:public|private|protected|static|async|export)?\s*(?:async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[\w<>[\],\s|&]+)?\s*\{/g,
      // def name(...): for Python-like
      /(?:^|\n)\s*(?:async\s+)?def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[\w\[\],\s|]+)?:/g,
      // func name(...) for Go
      /(?:^|\n)\s*func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\([^)]*\)\s*(?:\([^)]*\)|\w+)?\s*\{/g,
      // class methods
      /(?:^|\n)\s*(?:public|private|protected|static)?\s*(\w+)\s*\([^)]*\)\s*(?::\s*[\w<>[\],\s|&]+)?\s*\{/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        
        // Skip common keywords
        if (['if', 'for', 'while', 'switch', 'catch', 'return'].includes(name)) {
          continue;
        }

        const line = this.extractLineNumber(content, match[0]);
        const column = this.extractColumnNumber(content, match[0]);

        functions.push(
          this.createFunction(
            name,
            line,
            column,
            match[0].trim(),
            filePath,
            [],
            'unknown',
            false,
            false
          )
        );
      }
    }

    return functions;
  }

  getLanguage(): Language {
    return this.language;
  }
}
