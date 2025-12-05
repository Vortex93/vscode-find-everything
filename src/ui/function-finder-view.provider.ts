import * as vscode from 'vscode';
import { FunctionFinderService } from '../services/function-finder.service';
import { Function } from '../models/function.model';

export class FunctionFinderViewProvider implements vscode.TreeDataProvider<FunctionTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FunctionTreeItem | undefined | null | void> =
    new vscode.EventEmitter<FunctionTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FunctionTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private functions: Function[] = [];

  constructor(private service: FunctionFinderService) {
    this.loadFunctions();
  }

  refresh(): void {
    this.loadFunctions();
    this._onDidChangeTreeData.fire(null);
  }

  getTreeItem(element: FunctionTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FunctionTreeItem): Promise<FunctionTreeItem[]> {
    if (!element) {
      // Root level: group by file
      const fileGroups = new Map<string, Function[]>();
      for (const fn of this.functions) {
        if (!fileGroups.has(fn.file)) {
          fileGroups.set(fn.file, []);
        }
        fileGroups.get(fn.file)!.push(fn);
      }

      return Array.from(fileGroups.entries()).map(
        ([file, functions]) =>
          new FunctionTreeItem(
            file,
            vscode.TreeItemCollapsibleState.Collapsed,
            functions,
            'file',
            undefined
          )
      );
    } else if (element.contextValue === 'file') {
      // File level: show functions
      return (element.functions || []).map(
        (fn) =>
          new FunctionTreeItem(
            `${fn.name}(${fn.parameters.map((p) => p.name).join(', ')})`,
            vscode.TreeItemCollapsibleState.None,
            [],
            'function',
            fn
          )
      );
    }

    return [];
  }

  private async loadFunctions(): Promise<void> {
    this.functions = await this.service.searchAllFunctions();
  }
}

export class FunctionTreeItem extends vscode.TreeItem {
  public fn?: Function;

  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public functions?: Function[],
    public contextValue?: string,
    fn?: Function
  ) {
    super(label, collapsibleState);
    this.fn = fn;

    if (contextValue === 'function' && fn) {
      this.command = {
        command: 'vscode-finder.goToFunction',
        title: 'Go to Function',
        arguments: [fn],
      };
      this.iconPath = new vscode.ThemeIcon('symbol-method');
    } else if (contextValue === 'file') {
      this.iconPath = new vscode.ThemeIcon('file-code');
    }
  }
}
