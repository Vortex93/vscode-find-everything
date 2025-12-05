export interface Function {
  name: string;
  language: Language;
  file: string;
  line: number;
  column: number;
  signature: string;
  parameters: Parameter[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  docComment?: string;
}

export interface Parameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

export enum Language {
  TypeScript = 'typescript',
  Dart = 'dart',
  JavaScript = 'javascript',
  Python = 'python',
  Go = 'go',
  Java = 'java',
  Vue = 'vue',
  Cpp = 'cpp',
}

export interface SearchResult {
  functions: Function[];
  totalCount: number;
  language?: Language;
  timestamp: Date;
}
