// Main Lua Obfuscator

// Generate a valid Lua identifier name
// Names must start with a letter or underscore, followed by letters, numbers, or underscores
function generateValidName(length = 8) {
    const startChars = '_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const middleChars = '_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    // Start with a valid first character
    let name = startChars[Math.floor(Math.random() * startChars.length)];
    
    // Add remaining characters
    for (let i = 1; i < length; i++) {
        name += middleChars[Math.floor(Math.random() * middleChars.length)];
    }
    
    return name;
}

// Generate a unique name that doesn't conflict with existing names
function generateUniqueName(usedNames, protectedNames, length = 8) {
    let name;
    let attempts = 0;
    const maxAttempts = 100;
    const maxLength = 32; // Maximum reasonable identifier length
    
    do {
        name = generateValidName(length);
        attempts++;
        
        if (attempts > maxAttempts) {
            // If we can't find a unique name, make it longer
            length++;
            attempts = 0;
            
            // Safety check: prevent infinite loop
            if (length > maxLength) {
                throw new Error('Unable to generate unique identifier - namespace exhausted');
            }
        }
    } while (usedNames.has(name) || protectedNames.has(name));
    
    usedNames.add(name);
    return name;
}

// Build a rename map for identifiers
function buildRenameMap(analysis) {
    const renameMap = new Map();
    const usedNames = new Set();
    
    // Add all protected identifiers to used names to avoid collisions
    for (const name of analysis.protectedIdentifiers) {
        usedNames.add(name);
    }
    
    // Generate new names for renameable identifiers
    for (const identifier of analysis.renameableIdentifiers) {
        if (!renameMap.has(identifier)) {
            const newName = generateUniqueName(usedNames, analysis.protectedIdentifiers);
            renameMap.set(identifier, newName);
        }
    }
    
    return renameMap;
}

// Apply renaming to tokens
function applyRenaming(tokens, renameMap, analysis) {
    const renamedTokens = [];
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token.type === 'IDENTIFIER') {
            // Find previous non-whitespace token
            let prevNonWs = null;
            for (let j = i - 1; j >= 0; j--) {
                if (tokens[j].type !== 'WHITESPACE') {
                    prevNonWs = tokens[j];
                    break;
                }
            }
            
            // Don't rename if after dot or colon (property/method access)
            if (prevNonWs && (prevNonWs.value === '.' || prevNonWs.value === ':')) {
                renamedTokens.push(token);
                continue;
            }
            
            // Don't rename protected identifiers
            if (analysis.protectedIdentifiers.has(token.value)) {
                renamedTokens.push(token);
                continue;
            }
            
            // Apply renaming if available
            if (renameMap.has(token.value)) {
                renamedTokens.push({
                    ...token,
                    value: renameMap.get(token.value),
                    originalValue: token.value
                });
            } else {
                renamedTokens.push(token);
            }
        } else {
            renamedTokens.push(token);
        }
    }
    
    return renamedTokens;
}

// Reconstruct code from tokens
function reconstructCode(tokens) {
    let code = '';
    
    for (const token of tokens) {
        code += token.value;
    }
    
    return code;
}

// Main obfuscation function
function obfuscateLua(code, options = {}) {
    const {
        encryptStrings = true,
        renameVariables = true
    } = options;
    
    // Parse the code
    const analysis = parseLua(code);
    let tokens = analysis.tokens;
    let decryptionFunction = '';
    
    // Apply string encryption if enabled
    if (encryptStrings && analysis.strings.length > 0) {
        const encrypted = processStringsForEncryption(tokens, analysis);
        tokens = encrypted.tokens;
        decryptionFunction = encrypted.decryptionFunction;
    }
    
    // Apply variable renaming if enabled
    if (renameVariables) {
        const renameMap = buildRenameMap(analysis);
        tokens = applyRenaming(tokens, renameMap, analysis);
    }
    
    // Reconstruct the code
    let obfuscatedCode = reconstructCode(tokens);
    
    // Prepend decryption function if string encryption was used
    if (decryptionFunction) {
        obfuscatedCode = decryptionFunction + '\n' + obfuscatedCode;
    }
    
    return obfuscatedCode;
}
