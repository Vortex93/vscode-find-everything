import * as vscode from 'vscode';
import { FunctionFinderService } from '../services/function-finder.service';
import { Function } from '../models/function.model';

export class SearchFunctionsCommand {
  constructor(private service: FunctionFinderService) {}

  async execute(): Promise<void> {
    console.log('SearchFunctionsCommand: execute() called');
    
    // Show quick pick immediately with loading state
    const quickPick = vscode.window.createQuickPick();
    quickPick.placeholder = 'Searching for functions...';
    quickPick.busy = true;
    quickPick.show();
    console.log('SearchFunctionsCommand: Quick pick shown');

    try {
      console.log('SearchFunctionsCommand: Calling searchAllFunctions()');
      const functions = await this.service.searchAllFunctions();
      console.log(`SearchFunctionsCommand: Found ${functions.length} functions`);

      if (functions.length === 0) {
        quickPick.hide();
        vscode.window.showInformationMessage('No functions found in the workspace');
        return;
      }

      // Update quick pick with results
      quickPick.busy = false;
      quickPick.placeholder = `Found ${functions.length} functions. Type to search...`;
      quickPick.items = functions.map((fn) => ({
        label: fn.name,
        description: `${fn.file}:${fn.line}`,
        detail: fn.signature,
        function: fn,
      } as any));

      quickPick.matchOnDescription = true;
      quickPick.matchOnDetail = true;

      quickPick.onDidAccept(async () => {
        const selected = quickPick.selectedItems[0] as any;
        if (selected) {
          quickPick.hide();
          await this.navigateToFunction(selected.function);
        }
      });

      quickPick.onDidHide(() => quickPick.dispose());
    } catch (error) {
      console.error('SearchFunctionsCommand: Error:', error);
      quickPick.hide();
      vscode.window.showErrorMessage(`Error finding functions: ${error}`);
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
