/**
 * Main Luau Obfuscator Engine
 * Coordinates all obfuscation techniques
 */

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
        const chars = 'lIlIlIlI1O0OoO0o_';
        const length = this.options.obfuscationLevel === 'high' ? 
            Math.floor(Math.random() * 15) + 20 : 
            this.options.obfuscationLevel === 'medium' ?
            Math.floor(Math.random() * 10) + 10 :
            Math.floor(Math.random() * 5) + 6;
        
        let name = prefix || (Math.random() > 0.5 ? '_' : '');
        
        // Start with letter or underscore
        if (!name) {
            name = chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        for (let i = name.length; i < length; i++) {
            name += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Ensure uniqueness
        while (this.usedNames.has(name) || LuauParser.keywords.has(name)) {
            name += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        this.usedNames.add(name);
        return name;
    }

    // Rename variables and functions
    renameIdentifiers(code) {
        if (!this.options.renameVariables) return code;
        
        this.parser = new LuauParser(code);
        const identifiers = this.parser.getRenamableIdentifiers();
        
        // Create rename mapping
        this.renameMap.clear();
        this.usedNames.clear();
        
        identifiers.forEach(id => {
            this.renameMap.set(id, this.generateRandomName());
        });
        
        // Replace identifiers in code
        let result = code;
        
        // Sort by length (descending) to avoid partial replacements
        const sortedIds = Array.from(this.renameMap.keys()).sort((a, b) => b.length - a.length);
        
        for (const oldName of sortedIds) {
            const newName = this.renameMap.get(oldName);
            // Use word boundaries to avoid partial replacements
            // Escape special regex characters
            const escapedName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedName}\\b`, 'g');
            result = result.replace(regex, newName);
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

    // Add control flow obfuscation
    addControlFlowObfuscation(code) {
        if (!this.options.controlFlowObfuscation) return code;
        
        let result = code;
        
        // Add opaque predicates
        const opaquePredicates = [
            '((function() return true end)())',
            '((function() return 1 + 1 == 2 end)())',
            '((function() local x = 5 return x > 3 end)())',
            '(not (function() return false end)())',
            '((function() return "a" == "a" end)())'
        ];
        
        // Replace simple if statements with opaque predicates
        const ifPattern = /\bif\s+/g;
        result = result.replace(ifPattern, (match) => {
            if (Math.random() > 0.5) {
                const predicate = opaquePredicates[Math.floor(Math.random() * opaquePredicates.length)];
                return `if ${predicate} and `;
            }
            return match;
        });
        
        // Add control flow flattening for while loops
        if (this.options.obfuscationLevel === 'high') {
            result = this.flattenControlFlow(result);
        }
        
        return result;
    }

    // Control flow flattening
    flattenControlFlow(code) {
        // Simple control flow flattening using state machine
        const whilePattern = /while\s+(.+?)\s+do\s+([\s\S]+?)\s+end/g;
        
        return code.replace(whilePattern, (match, condition, body) => {
            if (Math.random() > 0.6) { // Apply randomly
                const stateVar = this.generateRandomName();
                return `local ${stateVar} = 1
while true do
    if ${stateVar} == 1 then
        if not (${condition}) then break end
        ${body}
    end
end`;
            }
            return match;
        });
    }

    // Inject dead code
    injectDeadCode(code) {
        if (!this.options.deadCodeInjection) return code;
        
        const deadCodeSnippets = [
            `local ${this.generateRandomName()} = function() return nil end`,
            `local ${this.generateRandomName()} = ${Math.floor(Math.random() * 1000)}`,
            `local ${this.generateRandomName()} = "${Math.random().toString(36).substring(7)}"`,
            `if false then ${this.generateRandomName()} = ${Math.random()} end`,
            `local ${this.generateRandomName()} = function(${this.generateRandomName()}) return ${this.generateRandomName()} end`,
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
            
            // Inject dead code randomly
            if (index > 0 && Math.random() > 0.7 && index % frequency === 0) {
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
