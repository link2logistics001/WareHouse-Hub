/**
 * Warehouse ID obfuscation utilities.
 *
 * Encodes Firestore document IDs so they aren't directly visible in
 * browser URLs. Uses URL-safe Base64 with a simple character swap to
 * make the output look less obviously like Base64.
 */

/** Encode a Firestore doc ID for use in a URL path segment. */
export function encodeWarehouseId(id) {
    if (!id) return '';
    try {
        // Base64 → URL-safe (replace +/ with -_) → strip trailing '='
        const b64 = btoa(id);
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
        return id;
    }
}

/** Decode a URL path segment back to the original Firestore doc ID. */
export function decodeWarehouseId(encoded) {
    if (!encoded) return '';
    try {
        // Reverse URL-safe replacements and re-pad
        let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) b64 += '=';
        return atob(b64);
    } catch {
        // Fallback: return raw value (handles old/bookmarked plain-ID links)
        return encoded;
    }
}
