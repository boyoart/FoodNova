import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'foodnova_cart';

// Helper to load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error('Failed to load cart:', error);
  }
  return [];
};

export const CartProvider = ({ children }) => {
  // Initialize state directly from localStorage to avoid race condition
  const [items, setItems] = useState(loadCartFromStorage);
  const [isOpen, setIsOpen] = useState(false);
  const isInitialMount = useRef(true);

  // Save cart to localStorage on change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product_id === item.product_id && i.pack_variant_id === item.pack_variant_id
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].qty += item.qty;
        return updated;
      }
      
      return [...prev, item];
    });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQty = (index, qty) => {
    if (qty < 1) {
      removeItem(index);
      return;
    }
    setItems((prev) => {
      const updated = [...prev];
      updated[index].qty = qty;
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
