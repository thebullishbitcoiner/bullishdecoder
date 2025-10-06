// bullishDecoder - BOLT12 Decoder PWA
import BOLT12Decoder from 'bolt12-decoder';
import { LightningAddress } from '@getalby/lightning-tools';
import { Invoice } from '@getalby/lightning-tools/bolt11';
import { getDecodedToken } from '@cashu/cashu-ts';

console.log('BOLT12Decoder imported:', BOLT12Decoder);

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
        
        // Check if it's a BOLT12 string (starts with lno1 or lni1)
        if (cleanInput.startsWith('lno1')) {
            return this.decodeBOLT12(cleanInput, 'offer');
        } else if (cleanInput.startsWith('lni1')) {
            return this.decodeBOLT12(cleanInput, 'invoice');
        } else if (cleanInput.startsWith('cashu')) {
            return this.decodeCashuToken(cleanInput);
        } else if (this.isLightningInvoice(cleanInput)) {
            return this.decodeLightningInvoice(cleanInput);
        } else if (this.isLightningAddress(cleanInput)) {
            return await this.decodeLightningAddress(cleanInput);
        } else {
            return {
                success: false,
                error: 'Not a recognized format. Expected BOLT12 strings (lno1/lni1), Cashu tokens (cashu...), Lightning invoices (lnbc/lntb), or Lightning addresses (user@domain.com).'
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
            
            const invoice = new Invoice({ pr: input });
            
            // Format the lightning invoice data for display
            const formattedData = {
                paymentRequest: input,
                amount: invoice.amount,
                amountMsat: invoice.amountMsat,
                description: invoice.description,
                descriptionHash: invoice.descriptionHash,
                paymentHash: invoice.paymentHash,
                paymentSecret: invoice.paymentSecret,
                destination: invoice.destination,
                timestamp: invoice.timestamp,
                expiry: invoice.expiry,
                cltvExpiry: invoice.cltvExpiry,
                features: invoice.features,
                network: invoice.network,
                tags: invoice.tags,
                isExpired: invoice.isExpired,
                isExpiredAt: invoice.isExpiredAt,
                isExpiredAtDate: invoice.isExpiredAtDate
            };
            
            return {
                success: true,
                type: 'lightning invoice',
                data: formattedData
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
                type: 'lightning-address',
                data: formattedData
            };
        } catch (error) {
            return {
                success: false,
                error: `Lightning address decoding failed: ${error.message}`
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
            
            // Format the Cashu token data for display
            const formattedData = {
                token: input,
                mint: decodedToken.mint,
                unit: decodedToken.unit,
                proofs: decodedToken.proofs,
                totalAmount: decodedToken.proofs.reduce((sum, proof) => sum + proof.amount, 0)
            };
            
            return {
                success: true,
                type: 'cashu-token',
                data: formattedData
            };
        } catch (error) {
            return {
                success: false,
                error: `Cashu token decoding failed: ${error.message}`
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
        this.outputContent.innerHTML = '<div class="placeholder">Waiting for input...</div>';
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

