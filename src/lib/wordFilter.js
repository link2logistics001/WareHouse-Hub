/**
 * Word Filter Utility
 *
 * Provides functions to identify and mask abusive or offensive language.
 */

// A starter list of common abusive and offensive words.
// In a production environment, this list should be more comprehensive
// and potentially loaded from a configuration file or external service.
const ABUSIVE_WORDS = [
    'abuse',
    'bastard',
    'bitch',
    'idiot',
    'moron',
    'stupid',
    'fuck',
    'shit',
    'asshole',
    'dick',
    'piss',
    'cunt',
    // Add more as needed or integrate a more robust library
];

/**
 * Filters abusive words from a given text string.
 * Replaces each found word with asterisks (e.g., "****").
 *
 * @param {string} text The input text to filter.
 * @returns {string} The filtered text.
 */
export const filterAbusiveWords = (text) => {
    if (!text || typeof text !== 'string') return text;

    let filteredText = text;

    ABUSIVE_WORDS.forEach((word) => {
        // Create a regex for the word with boundaries to avoid partial matches
        // (e.g., "butt" matches "butt" but not "button")
        // 'gi' flag makes it global and case-insensitive
        const regex = new RegExp(`\\b${word}\\b`, 'gi');

        filteredText = filteredText.replace(regex, (matched) => {
            return '*'.repeat(matched.length);
        });
    });

    return filteredText;
};
