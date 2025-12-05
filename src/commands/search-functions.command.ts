import * as vscode from 'vscode';
import { FunctionFinderService } from '../services/function-finder.service';
import { Function } from '../models/function.model';

export class SearchFunctionsCommand {
  constructor(private service: FunctionFinderService) {}

  async execute(): Promise<void> {
    const functions = await this.service.searchAllFunctions();

    if (functions.length === 0) {
      vscode.window.showInformationMessage('No functions found in the workspace');
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
        placeHolder: `Found ${functions.length} functions. Select one to navigate...`,
        matchOnDescription: true,
        matchOnDetail: true,
      }
    );

    if (selected) {
      await this.navigateToFunction(selected.function);
    }
  }

  private async navigateToFunction(fn: Function): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(fn.file);
      const editor = await vscode.window.showTextDocument(document);

      const line = fn.line - 1;
      const column = fn.column;
      const position = new vscode.Position(line, column);

      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position));
    } catch (error) {
      vscode.window.showErrorMessage(`Could not open file: ${fn.file}`);
    }
  }
}
