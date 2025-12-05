import * as vscode from 'vscode';
import { FunctionFinderService } from '../services/function-finder.service';
import { Language } from '../models/function.model';

export class SearchByLanguageCommand {
  constructor(private service: FunctionFinderService) {}

  async execute(): Promise<void> {
    const language = await vscode.window.showQuickPick(
      Object.values(Language),
      {
        placeHolder: 'Select a programming language...',
      }
    );

    if (!language) return;

    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const functions = await this.service.searchFunctionsByLanguage(workspacePath, language as Language);

    if (functions.length === 0) {
      vscode.window.showInformationMessage(`No ${language} functions found`);
      return;
    }

    const selected = await vscode.window.showQuickPick(
      functions.map((fn) => ({
        label: fn.name,
        description: `${fn.file}:${fn.line}`,
        detail: fn.signature,
        function: fn,
      })),
      {
        placeHolder: `Found ${functions.length} ${language} functions. Select one...`,
        matchOnDescription: true,
      }
    );

    if (selected) {
      await this.navigateToFunction(selected.function);
    }
  }

  private async navigateToFunction(fn: any): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(fn.file);
      const editor = await vscode.window.showTextDocument(document);

      const position = new vscode.Position(fn.line - 1, fn.column);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position));
    } catch (error) {
      vscode.window.showErrorMessage(`Could not open file: ${fn.file}`);
    }
  }
}
