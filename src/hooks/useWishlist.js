import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistedWarehouses, setWishlistedWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only business clients have wishlists
    if (!user || user.userType !== 'business_client') {
      setWishlistedWarehouses([]);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
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

    return () => unsubscribe();
  }, [user]);

  const toggleWishlist = useCallback(async (warehouseId, e) => {
    // Prevent the click from triggering the parent card's onClick (routing)
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!user || user.userType !== 'business_client') return;

    try {
      const docRef = doc(db, 'users', user.uid);
      const isCurrentlyWishlisted = wishlistedWarehouses.includes(warehouseId);

      // Optimistic upate (handled nicely by onSnapshot local cache anyway, but we can rely on updateDoc)
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
