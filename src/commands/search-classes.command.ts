import * as vscode from 'vscode';
import { FunctionFinderService } from '../services/function-finder.service';
import { Function } from '../models/function.model';

export class SearchClassesCommand {
  constructor(private service: FunctionFinderService) {}

  async execute(): Promise<void> {
    console.log('SearchClassesCommand: execute() called');
    
    const quickPick = vscode.window.createQuickPick();
    quickPick.placeholder = 'Searching for classes...';
    quickPick.busy = true;
    quickPick.show();
    console.log('SearchClassesCommand: Quick pick shown');

    try {
      console.log('SearchClassesCommand: Calling searchAllFunctions()');
      const allItems = await this.service.searchAllFunctions(undefined, false);
      const classes = allItems.filter(item => item.type === 'class');
      console.log(`SearchClassesCommand: Found ${classes.length} classes`);

      if (classes.length === 0) {
        quickPick.hide();
        vscode.window.showInformationMessage('No classes found in the workspace');
        return;
      }

      quickPick.busy = false;
      quickPick.placeholder = `Found ${classes.length} classes. Type to search...`;
      quickPick.items = classes.map((cls) => ({
        label: `$(symbol-class) ${cls.name}`,
        description: `${cls.file}:${cls.line}`,
        detail: cls.signature,
        function: cls,
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
      console.error('SearchClassesCommand: Error:', error);
      quickPick.hide();
      vscode.window.showErrorMessage(`Error finding classes: ${error}`);
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
