# 🔒 Lua-njingObfuscator

A powerful, client-side Luau code obfuscator designed specifically for Roblox developers. Protect your script hub code from theft and reverse engineering with advanced obfuscation techniques.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![Roblox](https://img.shields.io/badge/platform-Roblox-red.svg)
![GitHub Pages](https://img.shields.io/badge/hosted-GitHub%20Pages-green.svg)

## 🌟 Features

### Obfuscation Capabilities

1. **Variable/Function Renaming** 🔤
   - Replaces all meaningful variable and function names with randomized, unreadable identifiers
   - Preserves Luau keywords and Roblox built-in functions
   - Creates confusion for anyone trying to understand the code

2. **Strong String Encryption** 🔐
   - Implements custom XOR-based encryption for all string literals
   - Generates runtime decryption code automatically
   - Unique encryption keys for maximum security
   - Supports both single and multi-line strings

3. **Control Flow Obfuscation** 🌀
   - Transforms simple control structures into complex equivalents
   - Adds opaque predicates that are always true/false but hard to determine
   - Control flow flattening using state machines
   - Makes code flow difficult to follow

4. **Dead Code Injection** 💀
   - Inserts non-functional code blocks throughout the script
   - Code that never executes but adds complexity
   - Confuses reverse engineering tools and humans alike

5. **Variable Obfuscation** 🎭
   - Transforms simple variable assignments into complex patterns
   - Wraps values in immediately-invoked function expressions
   - Makes data flow harder to trace

6. **Junk Code Generation** 🗑️
   - Adds meaningless but syntactically valid code
   - Comments with random strings
   - Empty functions and do-end blocks
   - Increases code size and complexity

### Obfuscation Levels

- **Low** - Basic obfuscation for simple protection
- **Medium** - Balanced protection with good performance (recommended)
- **High** - Maximum obfuscation for critical code (may impact readability significantly)

## 🚀 Live Demo

Try it now: [https://rsalmn.github.io/Lua-njingObfuscator](https://rsalmn.github.io/Lua-njingObfuscator)

## 📖 How to Use

### Online Usage

1. Visit the [live demo](https://rsalmn.github.io/Lua-njingObfuscator)
2. Paste your Luau code in the left textarea
3. Select your desired obfuscation level and features
4. Click "🚀 Obfuscate Code"
5. Copy the obfuscated code from the right textarea
6. Use it in your Roblox scripts!

### Keyboard Shortcuts

- `Ctrl/Cmd + Enter` - Obfuscate code
- `Ctrl/Cmd + Shift + C` - Copy output to clipboard

### Feature Toggles

Each obfuscation technique can be toggled on/off independently:

- ✅ **Variable/Function Renaming** - Rename all identifiers
- ✅ **String Encryption** - Encrypt string literals
- ✅ **Control Flow Obfuscation** - Complex control structures
- ✅ **Dead Code Injection** - Insert non-functional code
- ✅ **Variable Obfuscation** - Transform variable patterns
- ✅ **Junk Code Generation** - Add meaningless code

### Example

**Before Obfuscation:**
```lua
local Players = game:GetService("Players")

local function greetPlayer(player)
    local message = "Welcome, " .. player.Name .. "!"
    print(message)
    return message
end

greetPlayer(Players.LocalPlayer)
```

**After Obfuscation:**
```lua
-- Obfuscated with Lua-njingObfuscator
-- https://github.com/rsalmn/Lua-njingObfuscator

local __key = "aB3dEf9Gh2Jk4Lm"
local __decrypt = function(s, k) -- [decryption code] end
local __strings = {
    [1] = __decrypt("...", __key),
    [2] = __decrypt("...", __key),
}

local lIlI1O0_OoO = game:GetService(__strings[1])
local function lI1OoO0_lIl(lIlIl_1O)
    local lI1O_oO0l = __strings[2] .. lIlIl_1O.Name .. __strings[3]
    print(lI1O_oO0l)
    return lI1O_oO0l
end
-- ... and more obfuscated code
```

## 🛠️ Technical Details

### Architecture

The obfuscator consists of three main modules:

1. **Parser (`js/parser.js`)**
   - Tokenizes Luau code
   - Identifies keywords, identifiers, strings, and operators
   - Supports Luau-specific features (type annotations, continue, etc.)
   - Handles multi-line strings and comments

2. **Encryption (`js/encryption.js`)**
   - XOR-based encryption for strings
   - Custom Base64-like encoding
   - Runtime decryption code generation
   - Multi-layer encryption support

3. **Obfuscator (`js/obfuscator.js`)**
   - Main orchestration engine
   - Applies all obfuscation techniques
   - Configurable options
   - Statistics tracking

### Security Considerations

⚠️ **Important Notes:**

- This tool provides **obfuscation**, not **encryption**. Determined attackers can still reverse engineer the code.
- Obfuscated code may be larger and slightly slower than original code
- Always keep your original source code in a safe place
- Test obfuscated code thoroughly before deployment
- Use for legitimate purposes only (protecting your own work)

## 📦 Deployment

### GitHub Pages Setup

1. Fork this repository
2. Go to repository Settings → Pages
3. Set Source to "main" branch
4. Your obfuscator will be live at `https://yourusername.github.io/Lua-njingObfuscator`

### Local Development

```bash
# Clone the repository
git clone https://github.com/rsalmn/Lua-njingObfuscator.git

# Navigate to directory
cd Lua-njingObfuscator

# Open index.html in your browser
# No build process required - it's pure client-side JavaScript!
```

### Self-Hosting

Simply upload all files to any web server. No server-side processing is required since all obfuscation happens in the browser.

## 🎨 Customization

### Modifying the Theme

Edit `css/style.css` to change colors:

```css
:root {
    --bg-primary: #1a1a2e;      /* Main background */
    --accent-primary: #00ff88;   /* Primary accent color */
    --accent-secondary: #00d9ff; /* Secondary accent color */
    /* ... more variables */
}
```

### Adding Custom Obfuscation

Extend the `LuauObfuscator` class in `js/obfuscator.js`:

```javascript
addCustomObfuscation(code) {
    // Your custom obfuscation logic
    return modifiedCode;
}
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Ideas for Contributions

- Add more obfuscation techniques
- Improve parser to handle edge cases
- Add syntax highlighting to textareas
- Create themes/skins
- Improve mobile responsiveness
- Add more encryption algorithms
- Performance optimizations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Raden Salman Alfaridzi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Built for the Roblox developer community
- Inspired by various code obfuscation techniques
- Uses pure vanilla JavaScript (no frameworks required)

## ⚠️ Disclaimer

This tool is provided for educational and legitimate protection purposes only. The authors are not responsible for any misuse of this tool. Always respect intellectual property rights and use obfuscation responsibly.

## 📞 Support

- 🐛 [Report a Bug](https://github.com/rsalmn/Lua-njingObfuscator/issues)
- 💡 [Request a Feature](https://github.com/rsalmn/Lua-njingObfuscator/issues)
- ⭐ [Star this Repository](https://github.com/rsalmn/Lua-njingObfuscator)

## 🔮 Future Plans

- [ ] Syntax highlighting in code editors
- [ ] Download obfuscated code as .lua file
- [ ] Preset configurations for different use cases
- [ ] API endpoint for automated obfuscation
- [ ] Browser extension version
- [ ] More encryption algorithms
- [ ] Code minification option
- [ ] Deobfuscation detection prevention

---

Made with ❤️ for Roblox Developers | [GitHub](https://github.com/rsalmn/Lua-njingObfuscator)
