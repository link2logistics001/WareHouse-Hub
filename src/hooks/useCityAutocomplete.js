/**
 * useCityAutocomplete.js — City Search Autocomplete Hook
 *
 * Custom React hook that provides city search functionality with:
 *  1. **Static Priority Matches** (India only) — A curated list of major Indian cities
 *     that appear instantly without an API call for fast user experience.
 *  2. **API-Driven Suggestions** — Fetches city data from the Nominatim (OpenStreetMap)
 *     API for any country, with automatic deduplication against static matches.
 *  3. **Debounced Input** — 300ms debounce to avoid hammering the API on every keystroke.
 *  4. **Keyboard Navigation** — Full arrow key and Enter/Escape support for the dropdown.
 *
 * Usage:
 *   const { searchQuery, handleSearchChange, suggestions, ... } = useCityAutocomplete('', 'IN');
 *
 * @param {string} initialValue — Pre-filled search query (e.g., from URL params)
 * @param {string} countryCode — ISO country code to scope results (default: 'IN')
 */

import { useState, useEffect } from 'react';
import { fetchCities } from '@/lib/locationService';

/**
 * Curated list of major Indian cities for instant priority matches.
 * These appear immediately without waiting for the API response.
 * Format: "City, State" for display in the dropdown.
 * Other countries rely entirely on the Nominatim API.
 */
const INDIAN_CITIES = [
    'Mumbai, Maharashtra',
    'Navi Mumbai, Maharashtra',
    'Bhiwandi, Maharashtra',
    'Thane, Maharashtra',
    'Pune, Maharashtra',
    'Nagpur, Maharashtra',
    'Nashik, Maharashtra',
    'New Delhi, Delhi',
    'Gurgaon, Haryana',
    'Noida, Uttar Pradesh',
    'Bengaluru, Karnataka',
    'Hyderabad, Telangana',
    'Chennai, Tamil Nadu',
    'Kolkata, West Bengal',
    'Ahmedabad, Gujarat',
    'Surat, Gujarat',
    'Jaipur, Rajasthan',
    'Lucknow, Uttar Pradesh',
    'Kanpur, Uttar Pradesh',
    'Indore, Madhya Pradesh',
    'Aurangabad, Maharashtra',
    'Vadodara, Gujarat',
    'Rajkot, Gujarat',
    'Chandigarh',
    'Ludhiana, Punjab',
    'Kochi, Kerala',
];

/**
 * useCityAutocomplete — Main hook for city search with autocomplete.
 *
 * @param {string} initialValue — Initial search text (e.g., from URL query params)
 * @param {string} [countryCode='IN'] — ISO 3166-1 alpha-2 code for scoping results
 * @returns {Object} State and handlers for the autocomplete input
 */
export function useCityAutocomplete(initialValue = '', countryCode = 'IN') {
    // The current text in the search input
    const [searchQuery, setSearchQuery] = useState(initialValue);

    // Array of suggestion strings to display in the dropdown
    const [suggestions, setSuggestions] = useState([]);

    // Whether the suggestions dropdown is currently visible
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Index of the currently highlighted suggestion (-1 = none)
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

    // Determine if we should include the static Indian cities list
    const isIndia = !countryCode || countryCode.toUpperCase() === 'IN';

    /**
     * Effect: Fetch suggestions whenever the search query changes.
     *
     * Steps:
     *  1. Skip if query is less than 3 characters (too short for meaningful results)
     *  2. Wait 300ms (debounce) to avoid excessive API calls
     *  3. Get static matches from INDIAN_CITIES (India only)
     *  4. Fetch API results from Nominatim (all countries)
     *  5. Filter API results to only include cities/towns (not POIs or roads)
     *  6. Deduplicate against static matches
     *  7. Merge and cap at 7 total suggestions
     */
    useEffect(() => {
        // Don't fetch suggestions for very short queries
        if (searchQuery.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        // Debounce: Wait 300ms after the last keystroke before fetching
        const timer = setTimeout(async () => {
            // 1. Get static matches first (India only — instant, no API call)
            const staticMatches = isIndia
                ? INDIAN_CITIES.filter((city) => {
                      const query = searchQuery.toLowerCase();
                      const cityLower = city.toLowerCase();
                      // Match if city name starts with query, or any word in the city starts with query
                      return cityLower.startsWith(query) || cityLower.split(' ').some((word) => word.startsWith(query));
                  })
                : [];

            // 2. Fetch from Nominatim API — pass country code for geographically scoped results
            const apiResults = await fetchCities(searchQuery, countryCode);

            // 3. Filter API results to only include place-type results (cities, towns, etc.)
            //    and remove duplicates that already exist in the static list
            const filteredApi = apiResults
                .filter((item) => {
                    const isPlace =
                        ['city', 'town', 'village', 'administrative', 'suburb', 'state'].includes(item.type) ||
                        ['place', 'boundary'].includes(item.class);
                    const isDuplicate = staticMatches.some((s) => s.toLowerCase().startsWith(item.name.toLowerCase()));
                    return isPlace && !isDuplicate;
                })
                .map((item) => item.display);

            // 4. Merge results: static matches first (higher priority), then API results
            const merged = [...staticMatches, ...filteredApi].slice(0, 7);

            // Only update suggestions if the dropdown is still meant to be visible
            if (showSuggestions) {
                setSuggestions(merged);
            }
        }, 300);

        // Cleanup: Cancel the debounce timer if the query changes before 300ms
        return () => clearTimeout(timer);
    }, [searchQuery, showSuggestions, countryCode, isIndia]);

    /**
     * handleSearchChange — Called when the user types in the search input.
     * Shows/hides the suggestions dropdown based on query length.
     *
     * @param {string} value — The new search input text
     */
    const handleSearchChange = (value) => {
        setSearchQuery(value);
        if (value.length >= 3) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
        setActiveSuggestionIndex(-1); // Reset keyboard navigation
    };

    /**
     * handleSuggestionClick — Called when the user clicks a suggestion in the dropdown.
     * Sets the input value to the selected suggestion and closes the dropdown.
     *
     * @param {string} suggestion — The selected city string
     */
    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion);
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
    };

    /**
     * handleKeyDown — Keyboard event handler for the search input.
     * Supports:
     *  - ArrowDown: Move highlight down in the dropdown
     *  - ArrowUp: Move highlight up in the dropdown
     *  - Enter: Select the highlighted suggestion, or trigger search callback
     *  - Escape: Close the dropdown
     *
     * @param {KeyboardEvent} e — The keyboard event
     * @param {Function} onEnterCallback — Called when Enter is pressed with no selection
     */
    const handleKeyDown = (e, onEnterCallback) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeSuggestionIndex >= 0) {
                // Select the currently highlighted suggestion
                handleSuggestionClick(suggestions[activeSuggestionIndex]);
            } else if (onEnterCallback) {
                // No suggestion selected — trigger the search
                onEnterCallback(searchQuery);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // Return all state and handlers needed by the consuming component
    return {
        searchQuery,
        setSearchQuery,
        suggestions,
        showSuggestions,
        setShowSuggestions,
        activeSuggestionIndex,
        setActiveSuggestionIndex,
        handleSearchChange,
        handleSuggestionClick,
        handleKeyDown,
    };
}
