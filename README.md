# VSCode Function Finder

A powerful VS Code extension that searches and lists all functions within your entire project.

## Features

- 🔍 **Search All Functions**: Find functions across your entire workspace
- 🎯 **Language Support**: Support for TypeScript, Dart, Vue, JavaScript, and more
- 📁 **File Filtering**: Filter functions by file type or language
- 🚀 **Quick Navigation**: Jump to function definitions with a single click
- 📊 **Function Info**: View function signatures, parameters, and return types
- ⌨️ **Keyboard Shortcuts**: Fast access with configurable keybindings

## Installation

1. Clone this repository
2. Run `npm install`
3. Press `F5` to open VS Code Extension Development Host

## Usage

### Commands

- **Find Functions** (`Ctrl+Shift+F`): Open the function finder panel
- **Find Functions by Language**: Filter functions by programming language
- **Find Functions in Current File**: Search functions in the active editor

## Supported Languages

- TypeScript
- Dart
- JavaScript
- Vue
- Python
- Go
- Java
- C/C++

## Development

```bash
npm install      # Install dependencies
npm run compile  # Compile TypeScript
npm run watch    # Watch for changes
npm run test     # Run tests
npm run lint     # Run ESLint
```

## Architecture

```
src/
├── extension/         # Main extension entry point
├── services/          # Business logic services
├── parsers/           # Language-specific parsers
├── commands/          # Command implementations
├── ui/                # UI components and views
├── models/            # Data models
└── utils/             # Utility functions
```

## License

MIT
