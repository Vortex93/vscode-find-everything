import * as vscode from 'vscode';
import { FunctionFinderService } from '../services/function-finder.service';
import { Function } from '../models/function.model';

export class SearchVariablesCommand {
  constructor(private service: FunctionFinderService) {}

  async execute(): Promise<void> {
    console.log('SearchVariablesCommand: execute() called');
    
    const quickPick = vscode.window.createQuickPick();
    quickPick.placeholder = 'Searching for variables...';
    quickPick.busy = true;
    quickPick.show();
    console.log('SearchVariablesCommand: Quick pick shown');

    try {
      console.log('SearchVariablesCommand: Calling searchAllFunctions()');
      const allItems = await this.service.searchAllFunctions(undefined, false);
      const variables = allItems.filter(item => item.type === 'variable');
      console.log(`SearchVariablesCommand: Found ${variables.length} variables`);

      if (variables.length === 0) {
        quickPick.hide();
        vscode.window.showInformationMessage('No variables found in the workspace');
        return;
      }

      quickPick.busy = false;
      quickPick.placeholder = `Found ${variables.length} variables. Type to search...`;
      quickPick.items = variables.map((v) => ({
        label: `$(symbol-variable) ${v.name}`,
        description: `${v.file}:${v.line}`,
        detail: v.signature,
        function: v,
      } as any));

      quickPick.matchOnDescription = true;
      quickPick.matchOnDetail = true;

      quickPick.onDidAccept(async () => {
        const selected = quickPick.selectedItems[0] as any;
        if (selected) {
          quickPick.hide();
          await this.navigateToItem(selected.function);
        }
      });

      quickPick.onDidHide(() => quickPick.dispose());
    } catch (error) {
      console.error('SearchVariablesCommand: Error:', error);
      quickPick.hide();
      vscode.window.showErrorMessage(`Error finding variables: ${error}`);
    }
  }

  private async navigateToItem(item: Function): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(item.file);
      const editor = await vscode.window.showTextDocument(document);

      const line = item.line - 1;
      const column = item.column;
      const position = new vscode.Position(line, column);

      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position));
    } catch (error) {
      vscode.window.showErrorMessage(`Could not open file: ${item.file}`);
    }
  }
}
