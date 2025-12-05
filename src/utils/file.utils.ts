export class FileUtils {
  static getFileExtension(filePath: string): string {
    const parts = filePath.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }

  static getFileName(filePath: string): string {
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }

  static getFileDirectory(filePath: string): string {
    const parts = filePath.split(/[\/\\]/);
    parts.pop();
    return parts.join('/');
  }

  static normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  static isRelativePath(filePath: string): boolean {
    return !filePath.startsWith('/') && !filePath.match(/^[a-zA-Z]:/);
  }
}
