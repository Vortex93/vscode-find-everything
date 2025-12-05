import * as vscode from 'vscode';
import { FunctionFinderService } from '../services/function-finder.service';
import { Function } from '../models/function.model';

export class FunctionFinderViewProvider implements vscode.TreeDataProvider<FunctionTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FunctionTreeItem | undefined | null | void> =
    new vscode.EventEmitter<FunctionTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FunctionTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private allItems: Function[] = [];

  constructor(private service: FunctionFinderService) {
    this.loadItems();
  }

  refresh(): void {
    this.loadItems();
    this._onDidChangeTreeData.fire(null);
  }

  getTreeItem(element: FunctionTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FunctionTreeItem): Promise<FunctionTreeItem[]> {
    if (!element) {
      // Root level: show category groups
      const items: FunctionTreeItem[] = [];
      
      const functions = this.allItems.filter(item => item.type === 'function');
      const classes = this.allItems.filter(item => item.type === 'class');
      const variables = this.allItems.filter(item => item.type === 'variable');
      const fields = this.allItems.filter(item => item.type === 'field');

      if (functions.length > 0) {
        items.push(new FunctionTreeItem(
          `Functions (${functions.length})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          functions,
          'category',
          undefined,
          'function'
        ));
      }

      if (classes.length > 0) {
        items.push(new FunctionTreeItem(
          `Classes (${classes.length})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          classes,
          'category',
          undefined,
          'class'
        ));
      }

      if (variables.length > 0) {
        items.push(new FunctionTreeItem(
          `Variables (${variables.length})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          variables,
          'category',
          undefined,
          'variable'
        ));
      }

      if (fields.length > 0) {
        items.push(new FunctionTreeItem(
          `Fields (${fields.length})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          fields,
          'category',
          undefined,
          'field'
        ));
      }

      return items;
    } else if (element.contextValue === 'category') {
      // Category level: show items
      return (element.functions || []).map(item => {
        const icon = this.getIconForType(item.type);
        return new FunctionTreeItem(
          `${item.name}`,
          vscode.TreeItemCollapsibleState.None,
          [],
          'item',
          item,
          item.type,
          icon
        );
      });
    }

    return [];
  }

  private getIconForType(type: string): string {
    switch (type) {
      case 'function': return 'symbol-method';
      case 'class': return 'symbol-class';
      case 'variable': return 'symbol-variable';
      case 'field': return 'symbol-field';
      default: return 'symbol-misc';
    }
  }

  private async loadItems(): Promise<void> {
    this.allItems = await this.service.searchAllFunctions(undefined, false);
  }
}

export class FunctionTreeItem extends vscode.TreeItem {
  public fn?: Function;

  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public functions?: Function[],
    public contextValue?: string,
    fn?: Function,
    private itemType?: string,
    iconName?: string
  ) {
    super(label, collapsibleState);
    this.fn = fn;

    if (contextValue === 'item' && fn) {
      this.command = {
        command: 'vscode-finder.goToFunction',
        title: 'Go to Item',
        arguments: [fn],
      };
      this.description = `${fn.file}:${fn.line}`;
      this.tooltip = fn.signature;
      this.iconPath = new vscode.ThemeIcon(iconName || 'symbol-misc');
    } else if (contextValue === 'category') {
      const categoryIcon = iconName || this.getCategoryIcon(itemType);
      this.iconPath = new vscode.ThemeIcon(categoryIcon);
    }
  }

  private getCategoryIcon(type?: string): string {
    switch (type) {
      case 'function': return 'symbol-method';
      case 'class': return 'symbol-class';
      case 'variable': return 'symbol-variable';
      case 'field': return 'symbol-field';
      default: return 'folder';
    }
  }
}
