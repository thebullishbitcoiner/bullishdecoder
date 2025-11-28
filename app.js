// bullishDecoder - BOLT12 Decoder PWA
import BOLT12Decoder from 'bolt12-decoder';
import { LightningAddress } from '@getalby/lightning-tools';
import { decode } from '@gandlaf21/bolt11-decode';
import { getDecodedToken, decodePaymentRequest } from '@cashu/cashu-ts';
import { decodeBech32 } from '@shocknet/clink-sdk';

console.log('BOLT12Decoder imported:', BOLT12Decoder);
console.log('decodeBech32 imported:', decodeBech32);

class BullishDecoder {
    constructor() {
        this.inputField = document.getElementById('input-field');
        this.outputContent = document.getElementById('output-content');
        this.stringType = document.getElementById('string-type');
        this.pasteButton = document.getElementById('paste-button');
        
        this.init();
    }
    
    init() {
        // Add event listeners
        this.inputField.addEventListener('paste', this.handlePaste.bind(this));
        this.pasteButton.addEventListener('click', this.handlePasteButton.bind(this));
        
        // Load version from package.json
        this.loadVersion();
        
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
            
            // Don't focus on mobile to prevent keyboard from appearing
            if (!this.isMobile()) {
                this.inputField.focus();
            }
            
            if (clipboardText.trim()) {
                this.decodeString(clipboardText.trim());
            }
        } catch (error) {
            console.error('Clipboard read failed:', error);
        }
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 768);
    }
    
    async decodeString(input) {
        
        try {
            // Detect string type and decode
            const result = await this.detectAndDecode(input);
            
            if (result.success) {
                this.displayResult(result);
            } else {
                this.displayError(result.error);
            }
        } catch (error) {
            this.displayError(`Unexpected error: ${error.message}`);
        }
    }
    
    async detectAndDecode(input) {
        // Remove any whitespace
        const cleanInput = input.replace(/\s/g, '');
        
        // Check if it's a CLINK static offer (starts with noffer1)
        if (cleanInput.startsWith('noffer1')) {
            return this.decodeCLINK(cleanInput);
        }
        // Check if it's a BOLT12 string (starts with lno1 or lni1)
        else if (cleanInput.startsWith('lno1')) {
            return this.decodeBOLT12(cleanInput, 'offer');
        } else if (cleanInput.startsWith('lni1')) {
            return this.decodeBOLT12(cleanInput, 'invoice');
        } else if (cleanInput.startsWith('cashu')) {
            return this.decodeCashuToken(cleanInput);
        } else if (cleanInput.startsWith('creq')) {
            return this.decodeCashuPaymentRequest(cleanInput);
        } else if (this.isLightningInvoice(cleanInput)) {
            return this.decodeLightningInvoice(cleanInput);
        } else if (this.isLightningAddress(cleanInput)) {
            return await this.decodeLightningAddress(cleanInput);
        } else {
            return {
                success: false,
                error: 'Not a recognized format. Expected CLINK offers (noffer1...), BOLT12 strings (lno1/lni1), Cashu tokens (cashu...), Cashu payment requests (creq...), Lightning invoices (lnbc/lntb), or Lightning addresses (user@domain.com).'
            };
        }
    }
    
    isLightningInvoice(input) {
        // Lightning invoice validation: starts with lnbc (mainnet) or lntb (testnet)
        return input.startsWith('lnbc') || input.startsWith('lntb');
    }
    
    isLightningAddress(input) {
        // Basic lightning address validation: user@domain.com format
        const lightningAddressRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return lightningAddressRegex.test(input);
    }
    
    decodeLightningInvoice(input) {
        try {
            const decoded = decode(input);
            
            return {
                success: true,
                type: 'lightning invoice',
                data: decoded
            };
        } catch (error) {
            return {
                success: false,
                error: `Lightning invoice decoding failed: ${error.message}`
            };
        }
    }
    
    async decodeLightningAddress(input) {
        try {
            
            const lnAddress = new LightningAddress(input);
            await lnAddress.fetch();
            
            if (!lnAddress.lnurlpData) {
                return {
                    success: false,
                    error: 'No LNURL-pay data found for this Lightning address'
                };
            }
            
            // Format the lightning address data for display
            const formattedData = {
                address: input,
                domain: lnAddress.domain,
                username: lnAddress.username,
                lnurlpData: lnAddress.lnurlpData,
                callback: lnAddress.lnurlpData.callback,
                maxSendable: lnAddress.lnurlpData.maxSendable,
                minSendable: lnAddress.lnurlpData.minSendable,
                metadata: lnAddress.lnurlpData.metadata,
                tag: lnAddress.lnurlpData.tag
            };
            
            return {
                success: true,
                type: 'lightning address',
                data: formattedData
            };
        } catch (error) {
            return {
                success: false,
                error: `Lightning address decoding failed: ${error.message}`
            };
        }
    }
    
    decodeCLINK(input) {
        try {
            if (typeof decodeBech32 === 'undefined') {
                throw new Error('decodeBech32 function not loaded');
            }
            
            const decoded = decodeBech32(input);
            
            // Verify the decoded type is 'noffer'
            if (decoded.type !== 'noffer') {
                return {
                    success: false,
                    error: `Type mismatch: expected noffer, got ${decoded.type}`
                };
            }
            
            // Return only the data part (without the type wrapper)
            return {
                success: true,
                type: 'clink-offer',
                data: decoded.data
            };
        } catch (error) {
            return {
                success: false,
                error: `CLINK decoding failed: ${error.message}`
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
    
    decodeCashuToken(input) {
        try {
            const decodedToken = getDecodedToken(input);
            
            return {
                success: true,
                type: 'cashu token',
                data: decodedToken
            };
        } catch (error) {
            return {
                success: false,
                error: `Cashu token decoding failed: ${error.message}`
            };
        }
    }
    
    decodeCashuPaymentRequest(input) {
        try {
            const decodedRequest = decodePaymentRequest(input);
            
            return {
                success: true,
                type: 'cashu payment request',
                data: decodedRequest
            };
        } catch (error) {
            return {
                success: false,
                error: `Cashu payment request decoding failed: ${error.message}`
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
        
        this.outputContent.innerHTML = this.escapeHtml(error);
        this.outputContent.className = 'output-content error';
    }
    
    clearOutput() {
        this.stringType.textContent = '';
        this.stringType.className = 'string-type';
        this.outputContent.innerHTML = '';
        this.outputContent.className = 'output-content';
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
    
    
    async loadVersion() {
        try {
            // Fetch package.json from root (Vercel deployment)
            const response = await fetch('/package.json');
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
                versionElement.textContent = 'v0.0.11';
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

