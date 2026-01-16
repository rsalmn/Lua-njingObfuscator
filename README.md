# Lua-njingObfuscator
Luau Obfuscator for Roblox scripts

## Features

✅ **Valid Variable Names** - Generates identifiers that always start with letters or underscores  
✅ **Safe Renaming** - Only renames local variables and function parameters  
✅ **API Preservation** - Never renames Roblox API methods, properties, or globals  
✅ **String Encryption** - XOR-based encryption with automatic decryption injection  
✅ **Working Output** - Produces executable code for Delta, Synapse X, Script-Ware, and other executors  

## Usage

1. Open `index.html` in your web browser
2. Paste your Lua/Luau code in the input box
3. Configure options:
   - **Encrypt Strings**: Enable XOR encryption for string literals
   - **Rename Variables**: Enable renaming of local variables
4. Click **🔒 Obfuscate**
5. Copy the obfuscated code

## What Gets Renamed

✅ Local variable declarations  
✅ Function parameters  
✅ User-defined local function names  

## What Never Gets Renamed

🔒 Lua keywords (`local`, `function`, `if`, `end`, etc.)  
🔒 Roblox globals (`game`, `workspace`, `script`, `Instance`, etc.)  
🔒 Built-in functions (`print`, `pairs`, `tostring`, etc.)  
🔒 Properties after `.` (e.g., `.Name`, `.LocalPlayer`, `.Character`)  
🔒 Methods after `:` (e.g., `:GetService()`, `:Wait()`, `:FindFirstChild()`)  
🔒 String contents (but they can be encrypted)  

## Example

**Input:**
```lua
local Players = game:GetService("Players")
local player = Players.LocalPlayer
print("Hello, " .. player.Name)
```

**Output:**
```lua
local function _d(s, k)
    local r = {}
    for i = 1, #s do
        r[i] = string.char(bit32.bxor(string.byte(s, i), string.byte(k, ((i-1) % #k) + 1)))
    end
    return table.concat(r)
end

local xFV7pCuB = game:GetService(_d("\x11:U1\x02\x1dG", "AV4Hgo4U"))
local IkYXJqpA = xFV7pCuB.LocalPlayer
print(_d("\x093X$\x08C\x14", "AV4Hgo4U") .. IkYXJqpA.Name)
```

## Technical Details

- **Parser**: Custom tokenizer that identifies all Lua language constructs
- **Renaming**: Smart scope-aware renaming that respects Lua semantics
- **Encryption**: XOR cipher with random keys and hex escape sequences
- **Output**: Valid Lua 5.1/Luau syntax compatible with Roblox

## Files

- `index.html` - Web interface
- `css/style.css` - Styling
- `js/parser.js` - Lua tokenizer and analyzer
- `js/encryption.js` - String encryption/decryption
- `js/obfuscator.js` - Main obfuscation logic

## License

See LICENSE file

