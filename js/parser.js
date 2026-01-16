// Lua/Luau Parser for Obfuscation
// Identifies tokens and determines what can be safely renamed

// Lua keywords that should never be renamed
const LUA_KEYWORDS = new Set([
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
    'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
    'true', 'until', 'while'
]);

// Roblox globals that should never be renamed
const ROBLOX_GLOBALS = new Set([
    'game', 'workspace', 'script', 'Instance', 'Vector3', 'CFrame', 'Color3',
    'UDim2', 'Enum', 'tick', 'wait', 'spawn', 'delay', 'shared', 'plugin',
    'PluginManager', 'LoadLibrary', '_G', '_VERSION', 'owner', 'NLS', 
    'NewLocalScript', 'NS', 'NewScript'
]);

// Built-in Lua functions that should never be renamed
const BUILTIN_FUNCTIONS = new Set([
    'print', 'warn', 'error', 'pairs', 'ipairs', 'next', 'tostring', 'tonumber',
    'type', 'typeof', 'pcall', 'xpcall', 'select', 'unpack', 'rawget', 'rawset',
    'setmetatable', 'getmetatable', 'assert', 'loadstring', 'require', 'getfenv',
    'setfenv', 'newproxy', 'collectgarbage', 'gcinfo', 'table', 'string', 'math',
    'coroutine', 'debug', 'bit32', 'utf8', 'os'
]);

// Token types
const TokenType = {
    IDENTIFIER: 'IDENTIFIER',
    KEYWORD: 'KEYWORD',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    OPERATOR: 'OPERATOR',
    PUNCTUATION: 'PUNCTUATION',
    COMMENT: 'COMMENT',
    WHITESPACE: 'WHITESPACE'
};

// Tokenize Lua code
function tokenize(code) {
    const tokens = [];
    let i = 0;
    
    while (i < code.length) {
        // Skip whitespace
        if (/\s/.test(code[i])) {
            let whitespace = '';
            while (i < code.length && /\s/.test(code[i])) {
                whitespace += code[i];
                i++;
            }
            tokens.push({ type: TokenType.WHITESPACE, value: whitespace });
            continue;
        }
        
        // Comments
        if (code[i] === '-' && code[i + 1] === '-') {
            if (code[i + 2] === '[' && code[i + 3] === '[') {
                // Multi-line comment
                let comment = '';
                while (i < code.length) {
                    comment += code[i];
                    if (code[i] === ']' && code[i + 1] === ']') {
                        comment += code[i + 1];
                        i += 2;
                        break;
                    }
                    i++;
                }
                tokens.push({ type: TokenType.COMMENT, value: comment });
            } else {
                // Single line comment
                let comment = '';
                while (i < code.length && code[i] !== '\n') {
                    comment += code[i];
                    i++;
                }
                tokens.push({ type: TokenType.COMMENT, value: comment });
            }
            continue;
        }
        
        // Strings
        if (code[i] === '"' || code[i] === "'") {
            const quote = code[i];
            let str = quote;
            i++;
            while (i < code.length) {
                if (code[i] === '\\' && i + 1 < code.length) {
                    str += code[i] + code[i + 1];
                    i += 2;
                } else if (code[i] === quote) {
                    str += code[i];
                    i++;
                    break;
                } else {
                    str += code[i];
                    i++;
                }
            }
            tokens.push({ type: TokenType.STRING, value: str });
            continue;
        }
        
        // Multi-line strings
        if (code[i] === '[' && code[i + 1] === '[') {
            let str = '[[';
            i += 2;
            while (i < code.length) {
                if (code[i] === ']' && code[i + 1] === ']') {
                    str += ']]';
                    i += 2;
                    break;
                }
                str += code[i];
                i++;
            }
            tokens.push({ type: TokenType.STRING, value: str });
            continue;
        }
        
        // Numbers
        if (/\d/.test(code[i]) || (code[i] === '.' && /\d/.test(code[i + 1]))) {
            let num = '';
            while (i < code.length && /[\d.xXeE+-]/.test(code[i])) {
                num += code[i];
                i++;
            }
            tokens.push({ type: TokenType.NUMBER, value: num });
            continue;
        }
        
        // Identifiers and keywords
        if (/[a-zA-Z_]/.test(code[i])) {
            let ident = '';
            while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
                ident += code[i];
                i++;
            }
            const type = LUA_KEYWORDS.has(ident) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
            tokens.push({ type, value: ident });
            continue;
        }
        
        // Multi-character operators
        if (i + 1 < code.length) {
            const twoChar = code[i] + code[i + 1];
            if (['==', '~=', '<=', '>=', '..', '//'].includes(twoChar)) {
                tokens.push({ type: TokenType.OPERATOR, value: twoChar });
                i += 2;
                continue;
            }
        }
        
        // Operators and punctuation
        if ('+-*/%^#=<>(){}[];:,.'.includes(code[i])) {
            const char = code[i];
            const type = '(){}[];:,.'.includes(char) ? TokenType.PUNCTUATION : TokenType.OPERATOR;
            tokens.push({ type, value: char });
            i++;
            continue;
        }
        
        // Unknown character - skip it
        i++;
    }
    
    return tokens;
}

// Analyze tokens to identify renameable identifiers
function analyzeTokens(tokens) {
    const analysis = {
        renameableIdentifiers: new Set(),
        protectedIdentifiers: new Set([...LUA_KEYWORDS, ...ROBLOX_GLOBALS, ...BUILTIN_FUNCTIONS]),
        strings: [],
        tokens: tokens
    };
    
    // Track scope for local variables
    const scopes = [new Set()];
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const prevToken = i > 0 ? tokens[i - 1] : null;
        const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;
        
        // Find previous non-whitespace token
        let prevNonWs = null;
        for (let j = i - 1; j >= 0; j--) {
            if (tokens[j].type !== TokenType.WHITESPACE) {
                prevNonWs = tokens[j];
                break;
            }
        }
        
        // Find next non-whitespace token
        let nextNonWs = null;
        for (let j = i + 1; j < tokens.length; j++) {
            if (tokens[j].type !== TokenType.WHITESPACE) {
                nextNonWs = tokens[j];
                break;
            }
        }
        
        if (token.type === TokenType.IDENTIFIER) {
            // Skip if it's after a dot (property access)
            if (prevNonWs && prevNonWs.value === '.') {
                analysis.protectedIdentifiers.add(token.value);
                continue;
            }
            
            // Skip if it's after a colon (method call)
            if (prevNonWs && prevNonWs.value === ':') {
                analysis.protectedIdentifiers.add(token.value);
                continue;
            }
            
            // Skip if protected
            if (analysis.protectedIdentifiers.has(token.value)) {
                continue;
            }
            
            // Check if it's a local variable declaration
            if (prevNonWs && prevNonWs.value === 'local') {
                analysis.renameableIdentifiers.add(token.value);
                scopes[scopes.length - 1].add(token.value);
                continue;
            }
            
            // Check if it's a function parameter (after 'function' keyword and before ')')
            let isParameter = false;
            for (let j = i - 1; j >= 0; j--) {
                if (tokens[j].type === TokenType.WHITESPACE) continue;
                if (tokens[j].value === '(') {
                    // Look back for 'function' keyword
                    for (let k = j - 1; k >= 0; k--) {
                        if (tokens[k].type === TokenType.WHITESPACE) continue;
                        if (tokens[k].value === 'function') {
                            isParameter = true;
                            break;
                        }
                        break;
                    }
                    break;
                }
                if (tokens[j].value === ')') break;
            }
            
            if (isParameter) {
                analysis.renameableIdentifiers.add(token.value);
                continue;
            }
            
            // Check if it's a function name after 'function' keyword
            if (prevNonWs && prevNonWs.value === 'function' && nextNonWs && nextNonWs.value === '(') {
                // Only rename local functions, not global ones
                let isLocal = false;
                for (let j = i - 1; j >= 0; j--) {
                    if (tokens[j].type === TokenType.WHITESPACE) continue;
                    if (tokens[j].value === 'function') {
                        // Check if there's 'local' before 'function'
                        for (let k = j - 1; k >= 0; k--) {
                            if (tokens[k].type === TokenType.WHITESPACE) continue;
                            if (tokens[k].value === 'local') {
                                isLocal = true;
                            }
                            break;
                        }
                        break;
                    }
                }
                
                if (isLocal) {
                    analysis.renameableIdentifiers.add(token.value);
                }
            }
        }
        
        // Collect strings for encryption
        if (token.type === TokenType.STRING) {
            analysis.strings.push({
                value: token.value,
                index: i
            });
        }
    }
    
    return analysis;
}

// Parse Lua code and return analysis
function parseLua(code) {
    const tokens = tokenize(code);
    const analysis = analyzeTokens(tokens);
    return analysis;
}
