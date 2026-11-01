// Re-export shim — the real implementation lives in ./printing/ (dual-path:
// USB ESC/POS + Windows print dialog). Kept so existing imports don't churn.
export * from './printing/printReceipt'
