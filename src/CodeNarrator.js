const vscode = require('vscode');
const speaker = require('./speak-service');

class CodeNarrator {
  constructor() {
  }
  
  async #getContextInformation() {
    const editor = vscode.window.activeTextEditor;
    if( !editor ) return {};
    
    const position = editor.selection.active;
    
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
      speaker.speak(`Line ${context.lineNumber+1}: ${context.lineText}`);
  }
  async speakStatement() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const position = editor.selection.active;
    const line = editor.document.lineAt(position.line).text;
    const trimmed = line.trim();

    if (!trimmed) {
      speaker.speak('Empty line.');
      return;
    }

    const semanticInfo = await this.#getSemanticTokens(position);
    const description = this.#describeStatement(trimmed, semanticInfo);

    speaker.speak(description);
  }

  #describeStatement(line, semanticInfo) {
    const contextPrefix = semanticInfo.containerName
      ? `In ${semanticInfo.containerName}: `
      : '';

    const description = this.#parseStatement(line);
    return contextPrefix + description;
  }

  #parseStatement(line) {
    // Remove trailing semicolons and braces for cleaner parsing
    const cleaned = line.replace(/[;{}]*\s*$/, '').trim();

    // Single closing brace
    if (/^\}?\s*$/.test(line.trim()) || line.trim() === '}') {
      return 'End of block.';
    }

    // else if
    if (/^\}\s*else\s+if\s*\((.+)\)/.test(line)) {
      const condition = line.match(/else\s+if\s*\((.+)\)/)[1];
      return `Otherwise, if ${this.#humanizeExpression(condition)}.`;
    }

    // else
    if (/^\}\s*else\s*\{?\s*$/.test(line.trim())) {
      return 'Otherwise.';
    }

    // Import/require statements
    const requireMatch = cleaned.match(/(?:const|let|var)\s+(\{[^}]+\}|\w+)\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/);
    if (requireMatch) {
      return `We import ${requireMatch[1]} from ${requireMatch[2]}.`;
    }
    const importMatch = cleaned.match(/import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      return `We import ${importMatch[1]} from ${importMatch[2]}.`;
    }

    // Class declaration
    const classMatch = cleaned.match(/class\s+(\w+)(?:\s+extends\s+(\w+))?/);
    if (classMatch) {
      const ext = classMatch[2] ? `, extending ${classMatch[2]}` : '';
      return `We define a class ${classMatch[1]}${ext}.`;
    }

    // Arrow function declaration
    const arrowMatch = cleaned.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(?([^)]*)\)?\s*=>/);
    if (arrowMatch) {
      const params = arrowMatch[2].trim();
      const paramDesc = params ? ` taking ${this.#humanizeParams(params)}` : '';
      return `We define ${arrowMatch[1]}${paramDesc}.`;
    }

    // Function declaration
    if (cleaned.match(/^(?:async\s+)?function\s+/)) {
      const m = cleaned.match(/(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
      if (m) {
        const params = m[2].trim();
        const paramDesc = params ? ` taking ${this.#humanizeParams(params)}` : '';
        const asyncPrefix = cleaned.startsWith('async') ? 'an async function' : 'a function';
        return `We define ${asyncPrefix} ${m[1]}${paramDesc}.`;
      }
    }

    // Method declaration (class methods, including private #methods)
    const methodMatch = cleaned.match(/^(?:async\s+)?(#?\w+)\s*\(([^)]*)\)\s*\{?\s*$/);
    if (methodMatch && !cleaned.match(/^(if|for|while|switch|catch)\s*\(/)) {
      const params = methodMatch[2].trim();
      const paramDesc = params ? ` taking ${this.#humanizeParams(params)}` : '';
      const asyncPrefix = cleaned.startsWith('async') ? 'an async method' : 'a method';
      return `We define ${asyncPrefix} ${methodMatch[1]}${paramDesc}.`;
    }

    // Variable declaration with assignment
    const varDeclMatch = cleaned.match(/^(const|let|var)\s+(\w+)\s*=\s*(.+)$/);
    if (varDeclMatch) {
      const kind = varDeclMatch[1] === 'const' ? 'constant' : 'variable';
      const value = this.#humanizeExpression(varDeclMatch[3]);
      return `We declare a ${kind} ${varDeclMatch[2]} and set it to ${value}.`;
    }

    // Variable declaration without assignment
    const varOnlyMatch = cleaned.match(/^(let|var)\s+(\w+)\s*$/);
    if (varOnlyMatch) {
      return `We declare a variable ${varOnlyMatch[2]}.`;
    }

    // Return statement
    const returnMatch = cleaned.match(/^return\s*(.*)$/);
    if (returnMatch) {
      if (!returnMatch[1].trim()) return 'We return.';
      return `We return ${this.#humanizeExpression(returnMatch[1])}.`;
    }

    // Throw statement
    const throwMatch = cleaned.match(/^throw\s+(.+)$/);
    if (throwMatch) {
      return `We throw ${this.#humanizeExpression(throwMatch[1])}.`;
    }

    // If statement
    const ifMatch = cleaned.match(/^if\s*\((.+)\)/);
    if (ifMatch) {
      return `We check if ${this.#humanizeExpression(ifMatch[1])}.`;
    }

    // For loop
    const forOfMatch = cleaned.match(/^for\s*\(\s*(?:const|let|var)\s+(\w+)\s+of\s+(.+)\)/);
    if (forOfMatch) {
      return `We loop over ${this.#humanizeExpression(forOfMatch[2])}, calling each item ${forOfMatch[1]}.`;
    }
    const forInMatch = cleaned.match(/^for\s*\(\s*(?:const|let|var)\s+(\w+)\s+in\s+(.+)\)/);
    if (forInMatch) {
      return `We loop over the keys of ${this.#humanizeExpression(forInMatch[2])}, calling each key ${forInMatch[1]}.`;
    }
    const forMatch = cleaned.match(/^for\s*\(\s*(?:let|var|const)?\s*(\w+)\s*=\s*([^;]+);\s*(.+);\s*(.+)\)/);
    if (forMatch) {
      return `We loop with ${forMatch[1]} starting at ${forMatch[2]}, while ${this.#humanizeExpression(forMatch[3])}, ${this.#humanizeIncrement(forMatch[4])}.`;
    }

    // While loop
    const whileMatch = cleaned.match(/^while\s*\((.+)\)/);
    if (whileMatch) {
      return `We loop while ${this.#humanizeExpression(whileMatch[1])}.`;
    }

    // Do-while
    if (cleaned === 'do') {
      return 'We begin a do-while loop.';
    }

    // Switch statement
    const switchMatch = cleaned.match(/^switch\s*\((.+)\)/);
    if (switchMatch) {
      return `We switch on ${this.#humanizeExpression(switchMatch[1])}.`;
    }

    // Case
    const caseMatch = cleaned.match(/^case\s+(.+):$/);
    if (caseMatch) {
      return `Case ${this.#humanizeExpression(caseMatch[1])}.`;
    }

    // Default case
    if (cleaned === 'default:') {
      return 'Default case.';
    }

    // Break/continue
    if (cleaned === 'break') return 'We break out of the loop.';
    if (cleaned === 'continue') return 'We skip to the next iteration.';

    // Try/catch/finally
    if (cleaned === 'try') return 'We try the following.';
    const catchMatch = cleaned.match(/^catch\s*\(\s*(\w+)\s*\)/);
    if (catchMatch) return `If an error occurs, we catch it as ${catchMatch[1]}.`;
    if (cleaned === 'finally') return 'Finally, we always do the following.';

    // Await expression
    const awaitMatch = cleaned.match(/^await\s+(.+)$/);
    if (awaitMatch) {
      return `We await ${this.#humanizeExpression(awaitMatch[1])}.`;
    }

    // Assignment
    const assignMatch = cleaned.match(/^(.+?)\s*([\+\-\*\/]?=)\s*(.+)$/);
    if (assignMatch && !assignMatch[1].match(/^(const|let|var)\s/)) {
      const op = assignMatch[2];
      const opDesc = op === '+=' ? 'increase' : op === '-=' ? 'decrease' : op === '*=' ? 'multiply' : op === '/=' ? 'divide' : 'set';
      if (opDesc === 'set') {
        return `We set ${this.#humanizeExpression(assignMatch[1])} to ${this.#humanizeExpression(assignMatch[3])}.`;
      }
      return `We ${opDesc} ${this.#humanizeExpression(assignMatch[1])} by ${this.#humanizeExpression(assignMatch[3])}.`;
    }

    // Method/function call
    const callMatch = cleaned.match(/^(?:await\s+)?(.+?\w)\s*\((.*)$/);
    if (callMatch) {
      const fn = callMatch[1];
      const argsRaw = callMatch[2].replace(/\)\s*$/, '');
      const argsDesc = argsRaw.trim() ? ` with ${this.#humanizeExpression(argsRaw)}` : '';
      return `We call ${fn}${argsDesc}.`;
    }

    // Comment
    const commentMatch = cleaned.match(/^\/\/\s*(.+)$/);
    if (commentMatch) {
      return `Comment: ${commentMatch[1]}.`;
    }
    const blockCommentMatch = cleaned.match(/^\/\*\*?\s*(.+?)(\*\/)?\s*$/);
    if (blockCommentMatch) {
      return `Comment: ${blockCommentMatch[1]}.`;
    }

    // module.exports
    const exportsMatch = cleaned.match(/^module\.exports\s*=\s*(.+)$/);
    if (exportsMatch) {
      return `We export ${this.#humanizeExpression(exportsMatch[1])}.`;
    }

    // Fallback
    return `Code: ${line}.`;
  }

  #humanizeExpression(expr) {
    if (!expr) return '';
    expr = expr.trim().replace(/;$/, '');

    // new Constructor(args)
    const newMatch = expr.match(/^new\s+(\w+)\s*\((.*)?\)$/);
    if (newMatch) {
      const args = newMatch[2]?.trim();
      const argsDesc = args ? ` with ${args}` : '';
      return `a new ${newMatch[1]}${argsDesc}`;
    }

    // Ternary
    const ternaryMatch = expr.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
    if (ternaryMatch) {
      return `${this.#humanizeExpression(ternaryMatch[1])} then ${this.#humanizeExpression(ternaryMatch[2])}, otherwise ${this.#humanizeExpression(ternaryMatch[3])}`;
    }

    // Comparisons
    expr = expr.replace(/\s*===\s*/g, ' equals ')
               .replace(/\s*!==\s*/g, ' does not equal ')
               .replace(/\s*==\s*/g, ' equals ')
               .replace(/\s*!=\s*/g, ' does not equal ')
               .replace(/\s*>=\s*/g, ' is greater than or equal to ')
               .replace(/\s*<=\s*/g, ' is less than or equal to ')
               .replace(/\s*>\s*/g, ' is greater than ')
               .replace(/\s*<\s*/g, ' is less than ');

    // Logical operators
    expr = expr.replace(/\s*&&\s*/g, ' and ')
               .replace(/\s*\|\|\s*/g, ' or ');

    // Negation
    expr = expr.replace(/!\s*(\w)/g, 'not $1');

    // typeof
    expr = expr.replace(/typeof\s+/g, 'the type of ');

    // null/undefined
    expr = expr.replace(/\bnull\b/g, 'null')
               .replace(/\bundefined\b/g, 'undefined');

    return expr;
  }

  #humanizeParams(params) {
    const paramList = params.split(',').map(p => p.trim()).filter(Boolean);
    if (paramList.length === 0) return '';
    if (paramList.length === 1) return paramList[0];
    if (paramList.length === 2) return `${paramList[0]} and ${paramList[1]}`;
    return paramList.slice(0, -1).join(', ') + ', and ' + paramList[paramList.length - 1];
  }

  #humanizeIncrement(expr) {
    expr = expr.trim();
    if (expr.match(/\w+\+\+/)) return `incrementing ${expr.replace('++', '')}`;
    if (expr.match(/\w+--/)) return `decrementing ${expr.replace('--', '')}`;
    if (expr.match(/\w+\s*\+=\s*(.+)/)) {
      const m = expr.match(/(\w+)\s*\+=\s*(.+)/);
      return `adding ${m[2]} to ${m[1]}`;
    }
    return expr;
  }

  describeContext() {
  }
}

module.exports = new CodeNarrator();