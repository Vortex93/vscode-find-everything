import * as vscode from 'vscode';
import { FunctionFinderService } from '../services/function-finder.service';

export class SearchInFileCommand {
  constructor(private service: FunctionFinderService) {}

  async execute(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const functions = await this.service.searchFunctionsInFile(filePath);

    if (functions.length === 0) {
      vscode.window.showInformationMessage('No functions found in current file');
      return;
    }

    const selected = await vscode.window.showQuickPick(
      functions.map((fn) => ({
        label: fn.name,
        description: `Line ${fn.line}`,
        detail: fn.signature,
        function: fn,
      })),
      {
        placeHolder: `Found ${functions.length} functions. Select one...`,
      }
    );

    if (selected) {
      const position = new vscode.Position(selected.function.line - 1, selected.function.column);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position));
    }
  }
}
