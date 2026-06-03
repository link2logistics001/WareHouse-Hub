/**
 * CityDropdown.js — City Suggestions Dropdown
 *
 * A reusable dropdown component that displays city autocomplete suggestions
 * below a search input. Used by the search page and hero section.
 *
 * Features:
 *  - Glassmorphism styling with backdrop blur
 *  - Keyboard navigation support (active item highlighting)
 *  - Location pin icon for each suggestion
 *  - Orange highlight on active/hovered items
 *  - Customizable positioning and styling via props
 *
 * Note: Uses `onMouseDown` instead of `onClick` to prevent the input's
 * `onBlur` from firing before the selection is registered.
 *
 * @param {Object} props
 * @param {string[]} props.suggestions — Array of city name strings to display
 * @param {boolean} props.showSuggestions — Whether the dropdown should be visible
 * @param {number} props.activeSuggestionIndex — Index of the keyboard-highlighted item (-1 = none)
 * @param {Function} props.onSuggestionClick — Called when a suggestion is selected
 * @param {Function} props.onSuggestionHover — Called when a suggestion is hovered (for keyboard sync)
 * @param {Object} props.customStyles — Additional inline styles for the dropdown container
 */

'use client';
import React from 'react';

export default function CityDropdown({
    suggestions,
    showSuggestions,
    activeSuggestionIndex,
    onSuggestionClick,
    onSuggestionHover,
    customStyles = {},
}) {
    // Don't render if there are no suggestions or the dropdown should be hidden
    if (!showSuggestions || suggestions.length === 0) return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: 'rgba(255, 255, 255, 0.98)', // Semi-transparent white for glassmorphism
                backdropFilter: 'blur(10px)', // Blur effect behind the dropdown
                borderRadius: '20px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                zIndex: 100,
                border: '1px solid rgba(226, 232, 240, 0.8)',
                textAlign: 'left',
                ...customStyles, // Allow parent to override positioning/styling
            }}
        >
            {/* Render each city suggestion as a clickable row */}
            {suggestions.map((suggestion, index) => (
                <div
                    key={index}
                    onMouseDown={(e) => {
                        // Use onMouseDown instead of onClick to prevent onBlur from firing
                        // before the selection is registered (input would lose focus first)
                        e.preventDefault();
                        onSuggestionClick(suggestion);
                    }}
                    onMouseEnter={() => onSuggestionHover(index)}
                    style={{
                        padding: '12px 20px',
                        fontSize: '0.9rem',
                        color: '#1e293b',
                        cursor: 'pointer',
                        // Highlight active/hovered item with orange background
                        background: activeSuggestionIndex === index ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                        // Add separator line between items (except the last one)
                        borderBottom: index === suggestions.length - 1 ? 'none' : '1px solid rgba(241, 245, 249, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'background 0.2s',
                    }}
                >
                    {/* Location pin icon */}
                    <svg
                        style={{ width: '14px', height: '14px', color: '#94a3b8' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    {/* Suggestion text — bold and orange when active */}
                    <span
                        style={{
                            fontWeight: activeSuggestionIndex === index ? 600 : 500,
                            color: activeSuggestionIndex === index ? '#f97316' : '#1e293b',
                        }}
                    >
                        {suggestion}
                    </span>
                </div>
            ))}
        </div>
    );
}
