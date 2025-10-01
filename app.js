// bullishDecoder - BOLT12 Decoder PWA
import BOLT12Decoder from 'bolt12-decoder';

console.log('BOLT12Decoder imported:', BOLT12Decoder);

class BullishDecoder {
    constructor() {
        this.inputField = document.getElementById('input-field');
        this.outputContent = document.getElementById('output-content');
        this.stringType = document.getElementById('string-type');
        this.statusText = document.querySelector('.status-text');
        this.pasteButton = document.getElementById('paste-button');
        
        this.init();
    }
    
    init() {
        // Add event listeners
        this.inputField.addEventListener('input', this.handleInput.bind(this));
        this.inputField.addEventListener('paste', this.handlePaste.bind(this));
        this.pasteButton.addEventListener('click', this.handlePasteButton.bind(this));
        
        // Load version from package.json
        this.loadVersion();
        
        // Initial status
        this.updateStatus('Ready - Paste a BOLT12 string to decode');
    }
    
    handleInput(event) {
        const input = event.target.value.trim();
        if (input) {
            this.decodeString(input);
        } else {
            this.clearOutput();
        }
    }
    
    handlePaste(event) {
        // Small delay to ensure paste content is available
        setTimeout(() => {
            const input = this.inputField.value.trim();
            if (input) {
                this.decodeString(input);
            }
        }, 10);
    }
    
    async handlePasteButton() {
        try {
            const clipboardText = await navigator.clipboard.readText();
            this.inputField.value = clipboardText;
            this.inputField.focus();
            
            if (clipboardText.trim()) {
                this.decodeString(clipboardText.trim());
            }
        } catch (error) {
            this.updateStatus('Failed to read clipboard - try pasting manually');
            console.error('Clipboard read failed:', error);
        }
    }
    
    decodeString(input) {
        this.updateStatus('Decoding...');
        
        try {
            // Detect string type and decode
            const result = this.detectAndDecode(input);
            
            if (result.success) {
                this.displayResult(result);
                this.updateStatus(`Successfully decoded ${result.type}`);
            } else {
                this.displayError(result.error);
                this.updateStatus('Decoding failed');
            }
        } catch (error) {
            this.displayError(`Unexpected error: ${error.message}`);
            this.updateStatus('Error occurred');
        }
    }
    
    detectAndDecode(input) {
        // Remove any whitespace
        const cleanInput = input.replace(/\s/g, '');
        
        // Check if it's a BOLT12 string (starts with lno1 or lni1)
        if (cleanInput.startsWith('lno1')) {
            return this.decodeBOLT12(cleanInput, 'offer');
        } else if (cleanInput.startsWith('lni1')) {
            return this.decodeBOLT12(cleanInput, 'invoice');
        } else {
            return {
                success: false,
                error: 'Not a recognized BOLT12 string. Expected strings starting with "lno1" (offers) or "lni1" (invoices).'
            };
        }
    }
    
    decodeBOLT12(input, expectedType) {
        try {
            // Use the BOLT12Decoder from the global scope
            if (typeof BOLT12Decoder === 'undefined') {
                throw new Error('BOLT12Decoder library not loaded');
            }
            
            const decoded = BOLT12Decoder.decode(input);
            
            // Verify the decoded type matches expected
            if (decoded.type !== expectedType) {
                return {
                    success: false,
                    error: `Type mismatch: expected ${expectedType}, got ${decoded.type}`
                };
            }
            
            return {
                success: true,
                type: decoded.type,
                data: decoded
            };
        } catch (error) {
            return {
                success: false,
                error: `BOLT12 decoding failed: ${error.message}`
            };
        }
    }
    
    displayResult(result) {
        this.stringType.textContent = result.type.toUpperCase();
        this.stringType.className = 'string-type success';
        
        const formattedJson = this.formatJSON(result.data);
        this.outputContent.innerHTML = formattedJson;
        this.outputContent.className = 'output-content success';
    }
    
    displayError(error) {
        this.stringType.textContent = 'ERROR';
        this.stringType.className = 'string-type error';
        
        this.outputContent.innerHTML = `<div class="error">${this.escapeHtml(error)}</div>`;
        this.outputContent.className = 'output-content error';
    }
    
    clearOutput() {
        this.stringType.textContent = '';
        this.stringType.className = 'string-type';
        this.outputContent.innerHTML = '<div class="placeholder">Waiting for input...</div>';
        this.outputContent.className = 'output-content';
        this.updateStatus('Ready - Paste a BOLT12 string to decode');
    }
    
    formatJSON(obj) {
        const jsonString = JSON.stringify(obj, null, 2);
        return this.syntaxHighlight(jsonString);
    }
    
    syntaxHighlight(json) {
        return json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateStatus(message) {
        this.statusText.textContent = message;
    }
    
    async loadVersion() {
        try {
            // Try to fetch from the correct path for GitHub Pages
            const response = await fetch('/bullishdecoder/package.json');
            const packageData = await response.json();
            const versionElement = document.getElementById('version');
            if (versionElement) {
                versionElement.textContent = `v${packageData.version}`;
            }
        } catch (error) {
            console.error('Failed to load version:', error);
            // Fallback to hardcoded version
            const versionElement = document.getElementById('version');
            if (versionElement) {
                versionElement.textContent = 'v0.0.3';
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BullishDecoder();
});

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
