const vscode = require('vscode');
const speaker = require('./speak-service');

console.log('speaker', speaker);
class CodeNarrator {

  constructor() {
  }
  
  async #getContextInformation() {
    const editor = vscode.window.activeTextEditor;
    if( !editor ) return {};
    
    const position = editor.selection.active;
console.log(position, editor.selection);
    
    const wordRange = editor.document.getWordRangeAtPosition(position);
    
    if( !wordRange ) return { documentName: editor.document.fileName };
    
    return {
      documentName: editor.document.fileName,
      word: editor.document.getText(wordRange),
      lineText: editor.document.lineAt(position.line).text,
      lineNumber: position.line,
    };
  }
  
  async #getSemanticTokens(position) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return {};

    const document = editor.document;
    const result = {
      symbols: undefined,
      semanticTokens: undefined,
      hover: undefined,
      definition: undefined,
      typeDefinition: undefined,
      currentSymbol: undefined,
      symbolKind: undefined,
      symbolDetail: undefined,
      containerName: '',
      scope: 'global'
    };
      
    try {
      // Try to get document symbols with fallback
      try {
          result.symbols = await vscode.commands.executeCommand(
              'vscode.executeDocumentSymbolProvider',
              document.uri
          );
      } catch (e) {
          console.log('Symbol provider not available, using basic parsing');
          result.symbols = await this.#getBasicSymbols(document);
      }

      // Try to get semantic tokens with fallback
      try {
          result.semanticTokens = await vscode.commands.executeCommand(
              'vscode.provideDocumentSemanticTokens',
              document.uri
          );
      } 
      catch (e) {
          console.log('Semantic tokens not available');
      }

      // Try to get hover information with fallback
      try {
          const hover = await vscode.commands.executeCommand(
              'vscode.executeHoverProvider',
              document.uri,
              position
          );
          result.hover = hover?.[0]?.contents;
      } 
      catch (e) {
          console.log('Hover provider not available');
      }

      // Try to get definition information with fallback
      try {
          result.definition = await vscode.commands.executeCommand(
              'vscode.executeDefinitionProvider',
              document.uri,
              position
          );
      } 
      catch (e) {
          console.log('Definition provider not available');
      }

      // Try to get type definition information with fallback
      try {
          result.typeDefinition = await vscode.commands.executeCommand(
              'vscode.executeTypeDefinitionProvider',
              document.uri,
              position
          );
      } 
      catch (e) {
          console.log('Type definition provider not available');
      }

      // Find the current symbol at position using available information
      if (result.symbols) {
          result.currentSymbol = this.#findSymbolAtPosition(result.symbols, position);
          if (result.currentSymbol) {
              result.symbolKind = result.currentSymbol.kind;
              result.symbolDetail = result.currentSymbol.detail;
              result.containerName = this.#findContainerName(result.symbols, position);
              result.scope = this.#determineScope(result.currentSymbol);
          }
      }

      // If no symbol information is available, try basic parsing
      if (!result.currentSymbol) {
          const basicInfo = this.#getBasicCodeInfo(document, position);
          result.scope = basicInfo.scope;
          result.containerName = basicInfo.containerName;
      }

      return result;
    } 
    catch (error) {
        console.error('Error in #getSemanticTokens:', error);
        return this.#getFallbackTokenInfo(document, position);
    }
  }  

  async #getBasicSymbols(document) {
    const symbols = [];
    const text = document.getText();
    
    // Basic regex patterns for common code structures
    const functionPattern = /(?:function|class|const|let|var)\s+(\w+)/g;
    let match;

    while ((match = functionPattern.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        
        symbols.push(new vscode.DocumentSymbol(
            match[1],
            '',
            match[0].startsWith('class') ? vscode.SymbolKind.Class : vscode.SymbolKind.Function,
            new vscode.Range(startPos, endPos),
            new vscode.Range(startPos, endPos)
        ));
    }

    return symbols;
  }

  #getBasicCodeInfo(document, position) {
    const line = document.lineAt(position.line).text;
    const text = document.getText();
    
    // Basic scope detection
    if (line.includes('class')) {
        return { scope: 'class', containerName: line.match(/class\s+(\w+)/)?.[1] || '' };
    }
    if (line.includes('function')) {
        return { scope: 'function', containerName: line.match(/function\s+(\w+)/)?.[1] || '' };
    }
    if (line.match(/const|let|var/)) {
        return { scope: 'variable', containerName: '' };
    }

    return { scope: 'global', containerName: '' };
  }

  #getFallbackTokenInfo(document, position) {
    const line = document.lineAt(position.line).text;
    const word = document.getText(document.getWordRangeAtPosition(position)) || '';
    
    return {
        symbols: [],
        semanticTokens: null,
        hover: null,
        definition: null,
        typeDefinition: null,
        currentSymbol: null,
        symbolKind: this.guessSymbolKind(line),
        symbolDetail: '',
        containerName: '',
        scope: this.guessScope(line),
        fallback: true
    };
  }
  
  #findSymbolAtPosition(symbols, position) {
    for (const symbol of symbols) {
        if (symbol.range.contains(position)) {
            if (symbol.children) {
                const childSymbol = this.#findSymbolAtPosition(symbol.children, position);
                if (childSymbol) return childSymbol;
            }
            return symbol;
        }
    }
    return undefined;
  }
  
  #findContainerName(symbols, position) {
    if (!symbols) return '';

    for (const symbol of symbols) {
        if (symbol.children) {
            // Check if position is within this symbol's children
            const childContainer = this.#findContainerName(symbol.children, position);
            if (childContainer) return `${symbol.name}.${childContainer}`;
        }

        // Check if position is within this symbol
        if (symbol.range.contains(position)) {
            return symbol.name;
        }
    }

    return '';
  }

  #determineScope(symbol) {
    if (!symbol) return 'global';

    switch (symbol.kind) {
        case vscode.SymbolKind.Class:
            return 'class';
        case vscode.SymbolKind.Method:
        case vscode.SymbolKind.Function:
            return 'function';
        case vscode.SymbolKind.Variable:
            return 'variable';
        case vscode.SymbolKind.Property:
            return 'property';
        case vscode.SymbolKind.Module:
            return 'module';
        default:
            return 'block';
    }
  }


  async speakWord() {
    const context = await this.#getContextInformation();
    if( context.word )
      speaker.speak(context.word);
  }
  async speakLine() {
    const context = await this.#getContextInformation();
    if( context.lineText )
      speaker.speak(`Zeile ${context.lineNumber+1}: ${context.lineText}`);
  }
  speakStatement() {
    speaker.speak('This eature is not yet implemented.');
  }
  describeContext() {
  
  }
}

module.exports = new CodeNarrator();