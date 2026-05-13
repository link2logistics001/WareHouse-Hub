/**
 * useWishlist.js — Wishlist Management Hook
 *
 * Custom React hook that manages a business client's wishlist (saved warehouses).
 *
 * How it works:
 *  1. Only business_client users have wishlists (other roles get an empty array).
 *  2. Uses Firestore `onSnapshot` for real-time sync — if the wishlist changes
 *     from another tab/device, it updates instantly.
 *  3. Wishlist data is stored as an array of warehouse IDs in the user's
 *     Firestore document: `users/{uid}.wishlistedWarehouses[]`
 *  4. Toggle uses Firestore's `arrayUnion` / `arrayRemove` for atomic operations.
 *
 * Usage:
 *   const { isWishlisted, toggleWishlist } = useWishlist();
 *   <button onClick={(e) => toggleWishlist(warehouseId, e)}>
 *     {isWishlisted(warehouseId) ? '❤️' : '🤍'}
 *   </button>
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useWishlist — Returns wishlist state and toggle functionality.
 *
 * @returns {Object} Wishlist state and handlers:
 *  - wishlistedWarehouses: string[] — Array of wishlisted warehouse IDs
 *  - toggleWishlist(id, event): Promise — Add/remove a warehouse from wishlist
 *  - isWishlisted(id): boolean — Check if a warehouse is in the wishlist
 *  - loading: boolean — Whether the initial wishlist data is still loading
 */
export function useWishlist() {
  const { user } = useAuth();

  // Array of warehouse IDs that the user has wishlisted
  const [wishlistedWarehouses, setWishlistedWarehouses] = useState([]);

  // Loading state for the initial Firestore fetch
  const [loading, setLoading] = useState(true);

  /**
   * Effect: Subscribe to real-time wishlist updates from Firestore.
   *
   * - Only subscribes for business_client users (other roles don't have wishlists)
   * - Uses onSnapshot for instant updates when wishlist changes
   * - Automatically cleans up the listener on unmount or user change
   */
  useEffect(() => {
    // Only business clients have wishlists
    if (!user || user.userType !== 'business_client') {
      setWishlistedWarehouses([]);
      setLoading(false);
      return;
    }

    // Subscribe to the user's Firestore document for real-time wishlist updates
    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Extract the wishlistedWarehouses array (default to empty)
          setWishlistedWarehouses(data.wishlistedWarehouses || []);
        } else {
          setWishlistedWarehouses([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching wishlist:', error);
        setLoading(false);
      }
    );

    // Cleanup: Unsubscribe from Firestore listener when user changes or component unmounts
    return () => unsubscribe();
  }, [user]);

  /**
   * toggleWishlist — Adds or removes a warehouse from the user's wishlist.
   *
   * Uses Firestore's atomic array operations:
   *  - arrayRemove: Removes the ID if it's currently in the array
   *  - arrayUnion: Adds the ID if it's not already in the array
   *
   * @param {string} warehouseId — The warehouse ID to toggle
   * @param {Event} e — The click event (used to prevent card navigation)
   */
  const toggleWishlist = useCallback(async (warehouseId, e) => {
    // Prevent the click from triggering the parent card's onClick (routing)
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Only business clients can use the wishlist
    if (!user || user.userType !== 'business_client') return;

    try {
      const docRef = doc(db, 'users', user.uid);
      const isCurrentlyWishlisted = wishlistedWarehouses.includes(warehouseId);

      // Toggle: remove if already wishlisted, add if not
      if (isCurrentlyWishlisted) {
        await updateDoc(docRef, {
          wishlistedWarehouses: arrayRemove(warehouseId)
        });
      } else {
        await updateDoc(docRef, {
          wishlistedWarehouses: arrayUnion(warehouseId)
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  }, [user, wishlistedWarehouses]);

  /**
   * isWishlisted — Check if a specific warehouse is in the user's wishlist.
   *
   * @param {string} warehouseId — The warehouse ID to check
   * @returns {boolean} True if the warehouse is wishlisted
   */
  const isWishlisted = useCallback((warehouseId) => {
    return wishlistedWarehouses.includes(warehouseId);
  }, [wishlistedWarehouses]);

  return {
    wishlistedWarehouses,
    toggleWishlist,
    isWishlisted,
    loading
  };
}
