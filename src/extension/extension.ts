import * as vscode from 'vscode';
import { FunctionFinderService } from '../services/function-finder.service';
import { SearchFunctionsCommand } from '../commands/search-functions.command';
import { SearchByLanguageCommand } from '../commands/search-by-language.command';
import { SearchInFileCommand } from '../commands/search-in-file.command';
import { FunctionFinderViewProvider } from '../ui/function-finder-view.provider';

let functionFinderService: FunctionFinderService;

export function activate(context: vscode.ExtensionContext) {
  console.log('VSCode Function Finder extension activated');

  // Initialize service
  functionFinderService = new FunctionFinderService(context);

  // Pre-warm cache in background
  setTimeout(() => {
    functionFinderService.searchAllFunctions().then(functions => {
      console.log('Background indexing complete:', functions.length, 'functions');
    });
  }, 1000);

  // Register commands
  const searchFunctionsCommand = new SearchFunctionsCommand(functionFinderService);
  const searchByLanguageCommand = new SearchByLanguageCommand(functionFinderService);
  const searchInFileCommand = new SearchInFileCommand(functionFinderService);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscode-finder.searchFunctions',
      () => searchFunctionsCommand.execute()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscode-finder.searchByLanguage',
      () => searchByLanguageCommand.execute()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscode-finder.searchInFile',
      () => searchInFileCommand.execute()
    )
  );

  // Register tree view
  const functionFinderViewProvider = new FunctionFinderViewProvider(functionFinderService);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      'functionFinder',
      functionFinderViewProvider
    )
  );

  // Refresh view on workspace change
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      functionFinderViewProvider.refresh();
    })
  );

  // Listen for file changes
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      functionFinderViewProvider.refresh();
    })
  );

  console.log('VSCode Function Finder extension ready');
}

export function deactivate() {
  functionFinderService?.dispose();
  console.log('VSCode Function Finder extension deactivated');
}
