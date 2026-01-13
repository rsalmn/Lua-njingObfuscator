/**
 * String Encryption Module
 * Provides strong encryption for string literals with runtime decryption
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

    // Base64-like encoding using custom alphabet
    customEncode(bytes) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        
        for (let i = 0; i < bytes.length; i += 3) {
            const b1 = bytes[i];
            const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
            const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
            
            const enc1 = b1 >> 2;
            const enc2 = ((b1 & 3) << 4) | (b2 >> 4);
            const enc3 = ((b2 & 15) << 2) | (b3 >> 6);
            const enc4 = b3 & 63;
            
            result += alphabet[enc1] + alphabet[enc2];
            result += (i + 1 < bytes.length) ? alphabet[enc3] : '=';
            result += (i + 2 < bytes.length) ? alphabet[enc4] : '=';
        }
        
        return result;
    }

    // Encrypt a string
    encrypt(str) {
        // Apply XOR encryption
        const encrypted = this.xorEncrypt(str, this.encryptionKey);
        
        // Encode to make it printable
        const encoded = this.customEncode(encrypted);
        
        return {
            original: str,
            encrypted: encoded,
            key: this.encryptionKey
        };
    }

    // Generate Lua decryption code
    generateDecryptionCode(varName = '__decrypt') {
        return `local ${varName} = function(s, k)
    local function decode(str)
        local alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
        local result = {}
        local idx = {}
        for i = 1, #alphabet do
            idx[alphabet:sub(i, i)] = i - 1
        end
        
        for i = 1, #str, 4 do
            local b1 = idx[str:sub(i, i)] or 0
            local b2 = idx[str:sub(i+1, i+1)] or 0
            local b3 = idx[str:sub(i+2, i+2)] or 0
            local b4 = idx[str:sub(i+3, i+3)] or 0
            
            local c1 = (b1 << 2) | (b2 >> 4)
            local c2 = ((b2 & 15) << 4) | (b3 >> 2)
            local c3 = ((b3 & 3) << 6) | b4
            
            table.insert(result, c1)
            if str:sub(i+2, i+2) ~= '=' then table.insert(result, c2) end
            if str:sub(i+3, i+3) ~= '=' then table.insert(result, c3) end
        end
        return result
    end
    
    local decoded = decode(s)
    local decrypted = {}
    for i = 1, #decoded do
        local charCode = decoded[i]
        local keyChar = k:byte((i - 1) % #k + 1)
        table.insert(decrypted, string.char(charCode ~ keyChar))
    end
    return table.concat(decrypted)
end`;
    }

    // Generate a string table with all encrypted strings
    generateStringTable(strings, tableName = '__strings', keyName = '__key') {
        const encryptedData = strings.map(s => this.encrypt(s));
        
        let code = `local ${keyName} = "${this.encryptionKey}"\n`;
        code += this.generateDecryptionCode() + '\n\n';
        code += `local ${tableName} = {\n`;
        
        encryptedData.forEach((data, index) => {
            code += `    [${index + 1}] = __decrypt("${data.encrypted}", ${keyName}),\n`;
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

    // Multi-layer encryption (for stronger obfuscation)
    multiLayerEncrypt(str, layers = 2) {
        let result = str;
        const keys = [];
        
        for (let i = 0; i < layers; i++) {
            const key = this.generateKey();
            keys.push(key);
            const encrypted = this.xorEncrypt(result, key);
            result = this.customEncode(encrypted);
        }
        
        return {
            encrypted: result,
            keys: keys
        };
    }

    // Generate multi-layer decryption code
    generateMultiLayerDecryptionCode(layers = 2) {
        let code = this.generateDecryptionCode() + '\n\n';
        
        code += `local __decrypt_multi = function(s, keys)
    local result = s
    for i = #keys, 1, -1 do
        result = __decrypt(result, keys[i])
    end
    return result
end\n`;
        
        return code;
    }

    // Randomize string encryption per occurrence
    randomizeEncryption(str) {
        // Use different keys for each occurrence
        const key = this.generateKey(Math.floor(Math.random() * 8) + 12);
        const encrypted = this.xorEncrypt(str, key);
        const encoded = this.customEncode(encrypted);
        
        return {
            encrypted: encoded,
            key: key,
            inline: true
        };
    }

    // Generate inline decryption call
    generateInlineDecryption(encryptedStr, key) {
        return `(function() local k="${key}" return __decrypt("${encryptedStr}", k) end)()`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StringEncryption;
}
