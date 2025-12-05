import { Function, Parameter, Language } from '../models/function.model';

export abstract class BaseParser {
  abstract parse(content: string, filePath: string): Function[];

  protected createFunction(
    name: string,
    line: number,
    column: number,
    signature: string,
    filePath: string,
    parameters: Parameter[] = [],
    returnType: string = 'void',
    isAsync: boolean = false,
    isExported: boolean = false,
    docComment?: string
  ): Function {
    return {
      name,
      language: this.getLanguage(),
      file: filePath,
      line,
      column,
      signature,
      parameters,
      returnType,
      isAsync,
      isExported,
      docComment,
    };
  }

  protected extractLineNumber(content: string, text: string): number {
    const index = content.indexOf(text);
    return content.substring(0, index).split('\n').length;
  }

  protected extractColumnNumber(content: string, text: string): number {
    const index = content.indexOf(text);
    const lastNewline = content.lastIndexOf('\n', index);
    return index - lastNewline - 1;
  }

  abstract getLanguage(): Language;
}
