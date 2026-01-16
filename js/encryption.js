// Simple XOR-based string encryption for Lua

// Generate a random encryption key
function generateKey(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
}

// Encrypt a string using XOR with a key
function encryptString(str, key) {
    let encrypted = '';
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        const xored = charCode ^ keyChar;
        encrypted += String.fromCharCode(xored);
    }
    return encrypted;
}

// Convert string to Lua escape sequences using decimal notation for compatibility
function toLuaEscapeSequence(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 32 || code > 126) {
            // Use \ddd decimal notation for non-printable characters (more compatible)
            result += '\\' + code.toString(10).padStart(3, '0');
        } else if (str[i] === '\\') {
            result += '\\\\';
        } else if (str[i] === '"') {
            result += '\\"';
        } else if (str[i] === "'") {
            result += "\\'";
        } else {
            result += str[i];
        }
    }
    return result;
}

// Extract the actual string content from a quoted string token
function extractStringContent(quotedString) {
    // Handle multi-line strings [[...]]
    if (quotedString.startsWith('[[') && quotedString.endsWith(']]')) {
        return quotedString.slice(2, -2);
    }
    
    // Handle regular quoted strings
    const quote = quotedString[0];
    let content = quotedString.slice(1, -1);
    
    // Process escape sequences in the correct order
    // First, handle double backslashes by converting to a placeholder
    content = content.replace(/\\\\/g, '\x00BACKSLASH\x00');
    // Then handle other escape sequences
    content = content.replace(/\\n/g, '\n');
    content = content.replace(/\\t/g, '\t');
    content = content.replace(/\\r/g, '\r');
    content = content.replace(/\\"/g, '"');
    content = content.replace(/\\'/g, "'");
    // Finally, restore backslashes
    content = content.replace(/\x00BACKSLASH\x00/g, '\\');
    
    return content;
}

// Generate the Lua decryption function
function generateDecryptionFunction() {
    return `local function _d(s, k)
    local r = {}
    for i = 1, #s do
        r[i] = string.char(bit32.bxor(string.byte(s, i), string.byte(k, ((i-1) % #k) + 1)))
    end
    return table.concat(r)
end
`;
}

// Encrypt a string and return the Lua code to decrypt it
function encryptStringForLua(quotedString, key) {
    // Extract actual content
    const content = extractStringContent(quotedString);
    
    // Encrypt the content
    const encrypted = encryptString(content, key);
    
    // Convert to Lua escape sequences
    const escaped = toLuaEscapeSequence(encrypted);
    
    // Return the decryption call
    return `_d("${escaped}", "${key}")`;
}

// Process all strings in the code for encryption
function processStringsForEncryption(tokens, analysis) {
    const encryptedTokens = [...tokens];
    const key = generateKey();
    
    // Encrypt each string
    for (const stringInfo of analysis.strings) {
        const token = encryptedTokens[stringInfo.index];
        if (token && token.type === 'STRING') {
            // Create encrypted version
            const encryptedCode = encryptStringForLua(token.value, key);
            
            // Replace the token value with the encrypted version
            encryptedTokens[stringInfo.index] = {
                ...token,
                value: encryptedCode,
                encrypted: true
            };
        }
    }
    
    return {
        tokens: encryptedTokens,
        decryptionFunction: generateDecryptionFunction()
    };
}
