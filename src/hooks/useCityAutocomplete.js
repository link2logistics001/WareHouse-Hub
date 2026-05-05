import { useState, useEffect } from 'react';
import { fetchCities } from '@/lib/locationService';

// Curated list for instant priority matches (India only — other countries use API)
const INDIAN_CITIES = [
  "Mumbai, Maharashtra", "Navi Mumbai, Maharashtra", "Bhiwandi, Maharashtra", "Thane, Maharashtra", "Pune, Maharashtra",
  "Nagpur, Maharashtra", "Nashik, Maharashtra", "New Delhi, Delhi", "Gurgaon, Haryana", "Noida, Uttar Pradesh",
  "Bengaluru, Karnataka", "Hyderabad, Telangana", "Chennai, Tamil Nadu", "Kolkata, West Bengal", "Ahmedabad, Gujarat",
  "Surat, Gujarat", "Jaipur, Rajasthan", "Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh", "Indore, Madhya Pradesh",
  "Aurangabad, Maharashtra", "Vadodara, Gujarat", "Rajkot, Gujarat", "Chandigarh", "Ludhiana, Punjab", "Kochi, Kerala"
];

/**
 * @param {string} initialValue
 * @param {string} [countryCode] — ISO 3166-1 alpha-2 (e.g. 'IN', 'US'). Defaults to India when empty.
 */
export function useCityAutocomplete(initialValue = '', countryCode = 'IN') {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const isIndia = !countryCode || countryCode.toUpperCase() === 'IN';

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      // 1. Get static matches first (India only)
      const staticMatches = isIndia
        ? INDIAN_CITIES.filter(city => {
            const query = searchQuery.toLowerCase();
            const cityLower = city.toLowerCase();
            return cityLower.startsWith(query) || cityLower.split(' ').some(word => word.startsWith(query));
          })
        : [];

      // 2. Fetch from API — pass country code for scoped results
      const apiResults = await fetchCities(searchQuery, countryCode);
      
      // 3. Filter API results
      const filteredApi = apiResults.filter(item => {
        const isPlace = ['city', 'town', 'village', 'administrative', 'suburb', 'state'].includes(item.type) || 
                        ['place', 'boundary'].includes(item.class);
        const isDuplicate = staticMatches.some(s => s.toLowerCase().startsWith(item.name.toLowerCase()));
        return isPlace && !isDuplicate;
      }).map(item => item.display);

      // 4. Merge results
      const merged = [...staticMatches, ...filteredApi].slice(0, 7);
      
      if (showSuggestions) {
        setSuggestions(merged);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showSuggestions, countryCode, isIndia]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (value.length >= 3) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    setActiveSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleKeyDown = (e, onEnterCallback) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0) {
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
      } else if (onEnterCallback) {
        onEnterCallback(searchQuery);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

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
    handleKeyDown
  };
}
