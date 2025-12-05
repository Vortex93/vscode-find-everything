import * as vscode from 'vscode';
import { FunctionFinderService } from '../services/function-finder.service';
import { Function } from '../models/function.model';

export class SearchFieldsCommand {
  constructor(private service: FunctionFinderService) {}

  async execute(): Promise<void> {
    console.log('SearchFieldsCommand: execute() called');
    
    const quickPick = vscode.window.createQuickPick();
    quickPick.placeholder = 'Searching for fields...';
    quickPick.busy = true;
    quickPick.show();
    console.log('SearchFieldsCommand: Quick pick shown');

    try {
      console.log('SearchFieldsCommand: Calling searchAllFunctions()');
      const allItems = await this.service.searchAllFunctions(undefined, false);
      const fields = allItems.filter(item => item.type === 'field');
      console.log(`SearchFieldsCommand: Found ${fields.length} fields`);

      if (fields.length === 0) {
        quickPick.hide();
        vscode.window.showInformationMessage('No fields found in the workspace');
        return;
      }

      quickPick.busy = false;
      quickPick.placeholder = `Found ${fields.length} fields. Type to search...`;
      quickPick.items = fields.map((f) => ({
        label: `$(symbol-field) ${f.name}`,
        description: `${f.file}:${f.line}`,
        detail: f.signature,
        function: f,
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
      console.error('SearchFieldsCommand: Error:', error);
      quickPick.hide();
      vscode.window.showErrorMessage(`Error finding fields: ${error}`);
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
