/**
 * Luau Code Parser
 * Tokenizes and parses Luau code for obfuscation
 */

class LuauParser {
    constructor(code) {
        this.code = code;
        this.position = 0;
        this.tokens = [];
        this.identifiers = new Set();
        this.stringLiterals = [];
    }

    // Luau keywords that should not be renamed
    static keywords = new Set([
        'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
        'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
        'true', 'until', 'while', 'continue', 'export', 'type'
    ]);

    // Built-in global functions and variables (expanded for Roblox)
    static builtins = new Set([
        // Lua standard library
        'print', 'warn', 'error', 'assert', 'pcall', 'xpcall', 'loadstring',
        'tonumber', 'tostring', 'type', 'pairs', 'ipairs', 'next', 'select',
        'getfenv', 'setfenv', 'getmetatable', 'setmetatable', 'rawget', 'rawset',
        'rawequal', 'unpack', 'table', 'string', 'math', 'coroutine', 'debug',
        'collectgarbage', 'dofile', 'gcinfo', 'getfenv', 'load', 'loadfile',
        'newproxy', 'setfenv',
        // Roblox globals (ONLY globals that appear without dot/colon)
        'game', 'workspace', 'script', 'wait', 'spawn', 'delay', 'tick', 'time',
        '_G', '_VERSION', 'shared', 'plugin',
        // Roblox classes (constructors)
        'Instance', 'Vector3', 'Vector2', 'CFrame', 'UDim', 'UDim2',
        'Color3', 'BrickColor', 'Enum', 'require', 'typeof', 'Ray', 'Axes',
        'Faces', 'Region3', 'Region3int16', 'PhysicalProperties', 'NumberRange',
        'NumberSequence', 'NumberSequenceKeypoint', 'ColorSequence', 'ColorSequenceKeypoint',
        'Rect', 'TweenInfo', 'Random', 'DockWidgetPluginGuiInfo', 'PathWaypoint',
        'OverlapParams', 'RaycastParams', 'RaycastResult', 'DateTime',
        // Roblox math/utility modules  
        'bit32', 'utf8', 'os', 'task',
        // Common methods/properties (should not be renamed when after . or :)
        'GetService', 'FindFirstChild', 'FindFirstChildOfClass', 'FindFirstChildWhichIsA',
        'WaitForChild', 'IsA', 'Clone', 'Destroy', 'GetChildren', 'GetDescendants',
        'Name', 'Parent', 'ClassName', 'Character', 'LocalPlayer', 'UserId',
        'DisplayName', 'Humanoid', 'HumanoidRootPart', 'Head', 'Torso',
        'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg', 'Health', 'MaxHealth',
        'WalkSpeed', 'JumpPower', 'Position', 'CFrame', 'Orientation', 'Size',
        'Transparency', 'CanCollide', 'Anchored', 'Material', 'Color',
        'BrickColor', 'Reflectance', 'Velocity', 'RotVelocity', 'Touched',
        'Changed', 'ChildAdded', 'ChildRemoved', 'DescendantAdded', 'DescendantRemoving',
        'GetPlayers', 'GetPlayerByUserId', 'GetPlayerFromCharacter',
        'PlayerAdded', 'PlayerRemoving', 'CharacterAdded', 'CharacterRemoving',
        'Kick', 'LoadCharacter', 'TeamColor', 'Team', 'Neutral',
        'Connect', 'Wait', 'Fire', 'Invoke', 'InvokeServer', 'FireServer',
        'InvokeClient', 'FireClient', 'OnServerEvent', 'OnClientEvent',
        'Value', 'Changed', 'Text', 'TextLabel', 'TextButton', 'TextBox',
        'Visible', 'BackgroundColor3', 'BorderColor3', 'TextColor3',
        'Font', 'TextSize', 'TextWrapped', 'TextScaled'
    ]);

    isWhitespace(char) {
        return /\s/.test(char);
    }

    isDigit(char) {
        return /[0-9]/.test(char);
    }

    isIdentifierStart(char) {
        return /[a-zA-Z_]/.test(char);
    }

    isIdentifierPart(char) {
        return /[a-zA-Z0-9_]/.test(char);
    }

    peek(offset = 0) {
        return this.code[this.position + offset] || '';
    }

    advance() {
        return this.code[this.position++] || '';
    }

    // Tokenize the code
    tokenize() {
        this.tokens = [];
        this.position = 0;

        while (this.position < this.code.length) {
            const char = this.peek();

            // Skip whitespace
            if (this.isWhitespace(char)) {
                this.advance();
                continue;
            }

            // Comments
            if (char === '-' && this.peek(1) === '-') {
                this.parseComment();
                continue;
            }

            // String literals
            if (char === '"' || char === "'") {
                this.parseString(char);
                continue;
            }

            // Multi-line strings
            if (char === '[' && (this.peek(1) === '[' || this.peek(1) === '=')) {
                this.parseMultilineString();
                continue;
            }

            // Numbers
            if (this.isDigit(char)) {
                this.parseNumber();
                continue;
            }

            // Identifiers and keywords
            if (this.isIdentifierStart(char)) {
                this.parseIdentifier();
                continue;
            }

            // Operators and punctuation
            this.parseOperator();
        }

        return this.tokens;
    }

    parseComment() {
        const start = this.position;
        this.advance(); // -
        this.advance(); // -

        // Multi-line comment
        if (this.peek() === '[' && (this.peek(1) === '[' || this.peek(1) === '=')) {
            let level = 0;
            this.advance(); // [
            while (this.peek() === '=') {
                level++;
                this.advance();
            }
            this.advance(); // [

            // Find matching ]]
            while (this.position < this.code.length) {
                if (this.peek() === ']') {
                    let closeLevel = 0;
                    let pos = this.position + 1;
                    while (pos < this.code.length && this.code[pos] === '=') {
                        closeLevel++;
                        pos++;
                    }
                    if (pos < this.code.length && this.code[pos] === ']' && closeLevel === level) {
                        this.position = pos + 1;
                        break;
                    }
                }
                this.advance();
            }
        } else {
            // Single line comment
            while (this.position < this.code.length && this.peek() !== '\n') {
                this.advance();
            }
        }

        this.tokens.push({
            type: 'comment',
            value: this.code.substring(start, this.position),
            start,
            end: this.position
        });
    }

    parseString(quote) {
        const start = this.position;
        this.advance(); // opening quote
        let value = '';

        while (this.position < this.code.length && this.peek() !== quote) {
            if (this.peek() === '\\') {
                this.advance();
                if (this.position < this.code.length) {
                    value += this.advance();
                }
            } else {
                value += this.advance();
            }
        }

        this.advance(); // closing quote

        const token = {
            type: 'string',
            value: value,
            rawValue: this.code.substring(start, this.position),
            start,
            end: this.position
        };

        this.tokens.push(token);
        this.stringLiterals.push(token);
    }

    parseMultilineString() {
        const start = this.position;
        this.advance(); // [

        let level = 0;
        while (this.peek() === '=') {
            level++;
            this.advance();
        }
        this.advance(); // [

        let value = '';
        while (this.position < this.code.length) {
            if (this.peek() === ']') {
                let closeLevel = 0;
                let pos = this.position + 1;
                while (pos < this.code.length && this.code[pos] === '=') {
                    closeLevel++;
                    pos++;
                }
                if (pos < this.code.length && this.code[pos] === ']' && closeLevel === level) {
                    this.position = pos + 1;
                    break;
                }
            }
            value += this.advance();
        }

        const token = {
            type: 'string',
            value: value,
            rawValue: this.code.substring(start, this.position),
            start,
            end: this.position,
            multiline: true
        };

        this.tokens.push(token);
        this.stringLiterals.push(token);
    }

    parseNumber() {
        const start = this.position;
        
        // Handle hex numbers
        if (this.peek() === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
            this.advance();
            this.advance();
            while (this.position < this.code.length && /[0-9a-fA-F]/.test(this.peek())) {
                this.advance();
            }
        } else {
            // Regular numbers
            while (this.position < this.code.length && this.isDigit(this.peek())) {
                this.advance();
            }

            // Decimal point
            if (this.peek() === '.' && this.isDigit(this.peek(1))) {
                this.advance();
                while (this.position < this.code.length && this.isDigit(this.peek())) {
                    this.advance();
                }
            }

            // Scientific notation
            if (this.peek() === 'e' || this.peek() === 'E') {
                this.advance();
                if (this.peek() === '+' || this.peek() === '-') {
                    this.advance();
                }
                while (this.position < this.code.length && this.isDigit(this.peek())) {
                    this.advance();
                }
            }
        }

        this.tokens.push({
            type: 'number',
            value: this.code.substring(start, this.position),
            start,
            end: this.position
        });
    }

    parseIdentifier() {
        const start = this.position;
        
        while (this.position < this.code.length && this.isIdentifierPart(this.peek())) {
            this.advance();
        }

        const value = this.code.substring(start, this.position);
        const isKeyword = LuauParser.keywords.has(value);

        this.tokens.push({
            type: isKeyword ? 'keyword' : 'identifier',
            value: value,
            start,
            end: this.position
        });

        if (!isKeyword && !LuauParser.builtins.has(value)) {
            this.identifiers.add(value);
        }
    }

    parseOperator() {
        const start = this.position;
        const char = this.advance();
        
        // Check for two-character operators
        const twoChar = char + this.peek();
        const threeChar = twoChar + this.peek(1);
        
        if (['==', '~=', '<=', '>=', '..', '//', '<<', '>>'].includes(twoChar)) {
            this.advance();
        } else if (threeChar === '...') {
            this.advance();
            this.advance();
        }

        this.tokens.push({
            type: 'operator',
            value: this.code.substring(start, this.position),
            start,
            end: this.position
        });
    }

    // Get all identifiers that can be renamed
    getRenamableIdentifiers() {
        this.tokenize();
        return Array.from(this.identifiers).filter(id => 
            !LuauParser.keywords.has(id) && !LuauParser.builtins.has(id)
        );
    }

    // Get all string literals
    getStringLiterals() {
        if (this.tokens.length === 0) {
            this.tokenize();
        }
        return this.stringLiterals;
    }

    // Reconstruct code from tokens
    reconstructCode(tokenOverrides = {}) {
        if (this.tokens.length === 0) {
            this.tokenize();
        }

        let result = '';
        let lastEnd = 0;

        for (let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            
            // Add any whitespace/content between tokens
            if (token.start > lastEnd) {
                result += this.code.substring(lastEnd, token.start);
            }

            // Use override value if provided
            const overrideKey = `${token.type}_${token.start}_${token.end}`;
            if (tokenOverrides[overrideKey]) {
                result += tokenOverrides[overrideKey];
            } else {
                result += this.code.substring(token.start, token.end);
            }

            lastEnd = token.end;
        }

        // Add any remaining content
        if (lastEnd < this.code.length) {
            result += this.code.substring(lastEnd);
        }

        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LuauParser;
}
