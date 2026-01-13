/**
 * Main Luau Obfuscator Engine
 * Coordinates all obfuscation techniques
 */

// Support Node.js environment (browser has these in global scope from other script tags)
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
    StringEncryption = require('./encryption.js');
    LuauParser = require('./parser.js');
}

class LuauObfuscator {
    constructor(options = {}) {
        this.options = {
            renameVariables: options.renameVariables !== false,
            encryptStrings: options.encryptStrings !== false,
            controlFlowObfuscation: options.controlFlowObfuscation !== false,
            deadCodeInjection: options.deadCodeInjection !== false,
            variableObfuscation: options.variableObfuscation !== false,
            junkCode: options.junkCode !== false,
            obfuscationLevel: options.obfuscationLevel || 'medium' // low, medium, high
        };
        
        this.parser = null;
        this.encryption = new StringEncryption();
        this.renameMap = new Map();
        this.usedNames = new Set();
    }

    // Generate random obfuscated identifier
    generateRandomName(prefix = '') {
        // FIXED: Only use letters and underscores, NO NUMBERS to ensure valid Lua identifiers
        const startChars = '_lIoO';  // First character - MUST be letter or underscore
        const middleChars = 'lIoO_lIoOlIoO';  // Subsequent characters - only letters and underscores
        const length = this.options.obfuscationLevel === 'high' ? 
            Math.floor(Math.random() * 15) + 20 : 
            this.options.obfuscationLevel === 'medium' ?
            Math.floor(Math.random() * 10) + 10 :
            Math.floor(Math.random() * 5) + 6;
        
        let name = prefix || '';
        
        // Start with letter or underscore (never a number)
        if (!name) {
            name = startChars.charAt(Math.floor(Math.random() * startChars.length));
        }
        
        // Add remaining characters
        for (let i = name.length; i < length; i++) {
            name += middleChars.charAt(Math.floor(Math.random() * middleChars.length));
        }
        
        // Ensure uniqueness and not a keyword
        while (this.usedNames.has(name) || LuauParser.keywords.has(name)) {
            name += middleChars.charAt(Math.floor(Math.random() * middleChars.length));
        }
        
        this.usedNames.add(name);
        return name;
    }

    // Rename variables and functions (IMPROVED - skip property/method access)
    renameIdentifiers(code) {
        if (!this.options.renameVariables) return code;
        
        this.parser = new LuauParser(code);
        this.parser.tokenize();
        
        // Get all tokens
        const tokens = this.parser.tokens;
        
        // Create rename mapping only for safe identifiers
        this.renameMap.clear();
        this.usedNames.clear();
        
        // First pass: identify which identifiers can be safely renamed
        const renamableIdentifiers = new Set();
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const prevToken = i > 0 ? tokens[i - 1] : null;
            const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;
            
            // Only consider identifier tokens
            if (token.type !== 'identifier') continue;
            
            // Skip if it's a builtin or keyword
            if (LuauParser.builtins.has(token.value) || LuauParser.keywords.has(token.value)) {
                continue;
            }
            
            // Skip if preceded by '.' or ':' (property/method access)
            if (prevToken && (prevToken.value === '.' || prevToken.value === ':')) {
                continue;
            }
            
            // Skip if followed by ':' (before method call)
            if (nextToken && nextToken.value === ':') {
                continue;
            }
            
            // Skip if in property assignment context like {Name = ...}
            if (nextToken && nextToken.value === '=' && prevToken && prevToken.value === ',') {
                continue;
            }
            if (nextToken && nextToken.value === '=' && i > 0 && tokens[i - 1].value === '{') {
                continue;
            }
            
            // This identifier is safe to rename
            renamableIdentifiers.add(token.value);
        }
        
        // Create rename mapping
        renamableIdentifiers.forEach(id => {
            this.renameMap.set(id, this.generateRandomName());
        });
        
        // Second pass: apply renaming carefully
        let result = '';
        let lastEnd = 0;
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const prevToken = i > 0 ? tokens[i - 1] : null;
            const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;
            
            // Add content before this token
            if (token.start > lastEnd) {
                result += code.substring(lastEnd, token.start);
            }
            
            // Check if this identifier should be renamed
            let shouldRename = false;
            if (token.type === 'identifier' && this.renameMap.has(token.value)) {
                // Double-check it's safe to rename
                const notAfterDotOrColon = !prevToken || (prevToken.value !== '.' && prevToken.value !== ':');
                const notBeforeColon = !nextToken || nextToken.value !== ':';
                
                shouldRename = notAfterDotOrColon && notBeforeColon;
            }
            
            // Output token (renamed or original)
            if (shouldRename) {
                result += this.renameMap.get(token.value);
            } else {
                result += code.substring(token.start, token.end);
            }
            
            lastEnd = token.end;
        }
        
        // Add any remaining content
        if (lastEnd < code.length) {
            result += code.substring(lastEnd);
        }
        
        return result;
    }

    // Encrypt string literals
    encryptStringLiterals(code) {
        if (!this.options.encryptStrings) return code;
        
        this.parser = new LuauParser(code);
        const strings = this.parser.getStringLiterals();
        
        if (strings.length === 0) return code;
        
        // Extract unique string values
        const uniqueStrings = [...new Set(strings.map(s => s.value))];
        
        // Generate string table
        const stringTable = this.encryption.generateStringTable(uniqueStrings);
        
        // Create replacement mapping
        const replacements = {};
        strings.forEach(token => {
            const index = uniqueStrings.indexOf(token.value) + 1;
            replacements[token.rawValue] = `__strings[${index}]`;
        });
        
        // Replace strings in code
        let result = code;
        for (const [oldStr, newStr] of Object.entries(replacements)) {
            result = result.replace(oldStr, newStr);
        }
        
        // Prepend string table
        result = stringTable.code + result;
        
        return result;
    }

    // Add control flow obfuscation (SAFER VERSION)
    addControlFlowObfuscation(code) {
        if (!this.options.controlFlowObfuscation) return code;
        
        let result = code;
        
        // ONLY add safe opaque predicates (always true)
        const safeOpaquePredicates = [
            '((function() return true end)())',
            '(not (function() return false end)())',
            '((function() return 1 + 1 == 2 end)())'
        ];
        
        // Only apply to simple if statements, and do it sparingly
        if (this.options.obfuscationLevel === 'high' || this.options.obfuscationLevel === 'medium') {
            const ifPattern = /\bif\s+/g;
            let matches = 0;
            result = result.replace(ifPattern, (match) => {
                matches++;
                // Only apply to every 4th if statement to avoid breaking code
                if (matches % 4 === 0 && Math.random() > 0.5) {
                    const predicate = safeOpaquePredicates[Math.floor(Math.random() * safeOpaquePredicates.length)];
                    return `if ${predicate} and `;
                }
                return match;
            });
        }
        
        // REMOVED control flow flattening as it can break code
        
        return result;
    }

    // Inject dead code (SAFER VERSION - avoid breaking syntax)
    injectDeadCode(code) {
        if (!this.options.deadCodeInjection) return code;
        
        const deadCodeSnippets = [
            `local ${this.generateRandomName()} = function() return nil end`,
            `local ${this.generateRandomName()} = ${Math.floor(Math.random() * 1000)}`,
            `local ${this.generateRandomName()} = "${Math.random().toString(36).substring(7)}"`,
            `if false then ${this.generateRandomName()} = ${Math.random()} end`,
            `do local ${this.generateRandomName()} = {} end`,
            `local ${this.generateRandomName()} = {${Math.random()}, ${Math.random()}}`,
        ];
        
        // Split code into lines
        const lines = code.split('\n');
        const result = [];
        
        const frequency = this.options.obfuscationLevel === 'high' ? 3 : 
                         this.options.obfuscationLevel === 'medium' ? 5 : 8;
        
        lines.forEach((line, index) => {
            result.push(line);
            
            // Only inject after complete statements (not inside tables, function calls, etc.)
            const trimmedLine = line.trim();
            const safeToInject = !trimmedLine.endsWith(',') && 
                                !trimmedLine.endsWith('(') && 
                                !trimmedLine.endsWith('{') &&
                                !trimmedLine.startsWith('[') &&
                                !trimmedLine.includes('return table.concat');
            
            // Inject dead code randomly at safe positions
            if (index > 0 && safeToInject && Math.random() > 0.7 && index % frequency === 0) {
                const snippet = deadCodeSnippets[Math.floor(Math.random() * deadCodeSnippets.length)];
                result.push(snippet);
            }
        });
        
        return result.join('\n');
    }

    // Variable obfuscation - transform assignments
    obfuscateVariables(code) {
        if (!this.options.variableObfuscation) return code;
        
        let result = code;
        
        // Transform simple assignments to complex ones
        // local x = 5 becomes local x = (function() return 5 end)()
        if (this.options.obfuscationLevel === 'high' && Math.random() > 0.5) {
            const assignPattern = /local\s+(\w+)\s+=\s+(\d+)/g;
            result = result.replace(assignPattern, (match, varName, value) => {
                if (Math.random() > 0.6) {
                    return `local ${varName} = (function() return ${value} end)()`;
                }
                return match;
            });
        }
        
        return result;
    }

    // Generate junk code
    generateJunkCode(code) {
        if (!this.options.junkCode) return code;
        
        const junkSnippets = [
            `-- ${Math.random().toString(36).substring(2, 15)}`,
            `local function ${this.generateRandomName()}() end`,
            `local ${this.generateRandomName()} = nil or ${Math.random()}`,
            `repeat until true`,
            `do end`,
        ];
        
        // Add junk at the beginning
        let result = '';
        
        const count = this.options.obfuscationLevel === 'high' ? 5 :
                     this.options.obfuscationLevel === 'medium' ? 3 : 1;
        
        for (let i = 0; i < count; i++) {
            result += junkSnippets[Math.floor(Math.random() * junkSnippets.length)] + '\n';
        }
        
        result += code;
        
        return result;
    }

    // Main obfuscation function
    obfuscate(code) {
        if (!code || code.trim() === '') {
            throw new Error('No code provided for obfuscation');
        }
        
        try {
            let result = code;
            
            // Add header comment
            result = `-- Obfuscated with Lua-njingObfuscator\n-- https://github.com/rsalmn/Lua-njingObfuscator\n\n` + result;
            
            // Apply obfuscation techniques in order
            
            // 1. Encrypt strings first (before renaming)
            if (this.options.encryptStrings) {
                result = this.encryptStringLiterals(result);
            }
            
            // 2. Rename identifiers
            if (this.options.renameVariables) {
                result = this.renameIdentifiers(result);
            }
            
            // 3. Add control flow obfuscation
            if (this.options.controlFlowObfuscation) {
                result = this.addControlFlowObfuscation(result);
            }
            
            // 4. Variable obfuscation
            if (this.options.variableObfuscation) {
                result = this.obfuscateVariables(result);
            }
            
            // 5. Inject dead code
            if (this.options.deadCodeInjection) {
                result = this.injectDeadCode(result);
            }
            
            // 6. Generate junk code
            if (this.options.junkCode) {
                result = this.generateJunkCode(result);
            }
            
            return result;
            
        } catch (error) {
            throw new Error(`Obfuscation failed: ${error.message}`);
        }
    }

    // Get statistics about the obfuscation
    getStats() {
        return {
            renamedIdentifiers: this.renameMap.size,
            encryptedStrings: this.encryption.encryptedStrings.length,
            options: this.options
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LuauObfuscator;
}
