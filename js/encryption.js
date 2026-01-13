/**
 * String Encryption Module
 * Provides XOR-based encryption with hidden key for Roblox/Luau compatibility
 */

class StringEncryption {
    constructor() {
        this.encryptedStrings = [];
        this.encryptionKey = this.generateKey();
    }

    // Generate a random encryption key
    generateKey(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < length; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }

    // XOR-based encryption (simple but effective for obfuscation)
    xorEncrypt(str, key) {
        let encrypted = [];
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            encrypted.push(charCode ^ keyChar);
        }
        return encrypted;
    }

    // Convert byte array to escaped string for Lua
    bytesToLuaString(bytes) {
        let result = '';
        for (let i = 0; i < bytes.length; i++) {
            const byte = bytes[i];
            // Use hex escape sequences
            result += '\\x' + ('0' + byte.toString(16)).slice(-2);
        }
        return result;
    }

    // Encrypt a string
    encrypt(str) {
        // Apply XOR encryption
        const encrypted = this.xorEncrypt(str, this.encryptionKey);
        const luaString = this.bytesToLuaString(encrypted);
        
        return {
            original: str,
            encrypted: luaString,
            key: this.encryptionKey
        };
    }

    // Generate obfuscated key construction code
    generateHiddenKeyCode(key, varName = '_k') {
        // Break the key into individual characters and construct it at runtime
        let code = `local ${varName} = (function()\n`;
        code += `    local _t = {}\n`;
        
        for (let i = 0; i < key.length; i++) {
            const charCode = key.charCodeAt(i);
            code += `    _t[${i + 1}] = string.char(0x${charCode.toString(16)})\n`;
        }
        
        code += `    return table.concat(_t)\n`;
        code += `end)()\n`;
        
        return code;
    }

    // Generate Lua decryption function (Luau-compatible with bit32)
    generateDecryptionCode(varName = '_d', keyVarName = '_k') {
        return `local function ${varName}(_s)
    local _r = {}
    for _i = 1, #_s do
        local _c = string.byte(_s, _i)
        local _kc = string.byte(${keyVarName}, ((_i - 1) % #${keyVarName}) + 1)
        _r[_i] = string.char(bit32.bxor(_c, _kc))
    end
    return table.concat(_r)
end`;
    }

    // Generate a string table with all encrypted strings and hidden key
    generateStringTable(strings, tableName = '__strings') {
        this.encryptedStrings = [];
        
        // Generate hidden key
        let code = '-- Hidden key generation\n';
        code += this.generateHiddenKeyCode(this.encryptionKey) + '\n';
        
        // Generate decryption function
        code += '-- Decryption function\n';
        code += this.generateDecryptionCode() + '\n\n';
        
        // Encrypt all strings
        const encryptedData = strings.map(s => this.encrypt(s));
        this.encryptedStrings = encryptedData;
        
        // Generate string table
        code += `-- Encrypted strings table\n`;
        code += `local ${tableName} = {\n`;
        
        encryptedData.forEach((data, index) => {
            code += `    [${index + 1}] = _d("${data.encrypted}"),\n`;
        });
        
        code += '}\n\n';
        
        return {
            code,
            encryptedData
        };
    }

    // Create a mapping for string replacements
    createStringMapping(strings) {
        const mapping = {};
        strings.forEach((str, index) => {
            mapping[str] = `__strings[${index + 1}]`;
        });
        return mapping;
    }

    // Generate inline encryption (for single strings)
    generateInlineDecryption(str) {
        const encrypted = this.encrypt(str);
        return `_d("${encrypted.encrypted}")`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StringEncryption;
}
