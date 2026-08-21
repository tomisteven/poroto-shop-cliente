import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState(0); // en %

  const addToCart = (product, options = {}) => {
    // === Promoción (combo) ===
    if (options.esPromocion) {
      const cartItemId = `promo-${options.promocion}`;
      const existItem = cartItems.find((x) => x.cartItemId === cartItemId);

      if (existItem) {
        setCartItems(
          cartItems.map((x) =>
            x.cartItemId === cartItemId
              ? {
                  ...existItem,
                  cantidad: existItem.cantidad + 1,
                  subtotal: (existItem.cantidad + 1) * existItem.precioVenta,
                }
              : x
          )
        );
      } else {
        const precioVenta = options.precioVenta !== undefined ? options.precioVenta : product.precioFinal;
        const precioCompra = options.precioCompra !== undefined ? options.precioCompra : product.subtotalCosto;
        setCartItems([...cartItems, {
          cartItemId,
          promocion: options.promocion,
          producto: product._id,
          nombre: options.nombre || product.nombre,
          sku: 'PROMO',
          precioVenta: precioVenta,
          precioCompra: precioCompra,
          cantidad: 1,
          subtotal: precioVenta,
          stockMaximo: 999,
          stockDeducido: 0,
          esPromocion: true,
          esVentaSuelta: false,
          esGenerico: false,
          precioUnitario: precioVenta,
        }]);
      }
      return true;
    }

    // Generamos un identificar único para la línea del carrito
    // Si no es genérico ni suelto, usamos el ID del producto para agrupar.
    // Si es genérico o suelto, podemos agrupar por producto+precio, o directamente separarlos.
    const isCustom = options.esGenerico || options.esVentaSuelta;
    const cartItemId = isCustom ? `${product._id}-${Date.now()}` : product._id;

    const existItem = cartItems.find((x) => x.cartItemId === cartItemId);
    
    // Calcular deducción de stock
    // Para venta suelta, si manda stockDeduction lo usamos. Si no, 1.
    const stockRequeridoAdicional = options.stockDeduction || 1;
    
    if (existItem) {
      if (product.stock < existItem.stockDeducido + stockRequeridoAdicional) {
         return false; // Sin stock
      }
      setCartItems(
        cartItems.map((x) =>
          x.cartItemId === cartItemId 
          ? { 
              ...existItem, 
              cantidad: existItem.cantidad + 1,
              stockDeducido: existItem.stockDeducido + stockRequeridoAdicional,
              subtotal: (existItem.cantidad + 1) * existItem.precioVenta 
            } 
          : x
        )
      );
    } else {
      if (product.stock < stockRequeridoAdicional) return false;
      const precioVenta = options.precioVenta !== undefined ? options.precioVenta : product.precioVenta;
      const subtotal = options.subtotal !== undefined ? options.subtotal : precioVenta;
      
      setCartItems([...cartItems, {
        cartItemId, // ID único para el carrito
        producto: product._id, // ID en base de datos
        nombre: options.nombrePersonalizado || product.nombre,
        sku: product.sku,
        precioVenta: precioVenta,
        precioCompra: product.precioCompra,
        cantidad: 1, // Representa "1 línea/bulto"
        subtotal: subtotal,
        stockMaximo: product.stock,
        // Props custom
        stockDeducido: stockRequeridoAdicional,
        esVentaSuelta: options.esVentaSuelta || false,
        kilosVendidos: options.kilosVendidos,
        esGenerico: options.esGenerico || false,
        precioUnitario: precioVenta
      }]);
    }
    return true;
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return removeFromCart(cartItemId);
    
    setCartItems(
      cartItems.map((x) => {
        if (x.cartItemId === cartItemId) {
          // Si es venta suelta, multiplicar stockDeducido base no es directo,
          // pero asumimos que newQuantity multiplica el "paquete" tal como se armó
          const multiplier = newQuantity;
          const originalStockDeducido = x.stockDeducido / x.cantidad; // deducción de 1 
          return { 
            ...x, 
            cantidad: newQuantity, 
            stockDeducido: originalStockDeducido * multiplier,
            subtotal: newQuantity * x.precioVenta,
            kilosVendidos: x.esVentaSuelta ? (x.kilosVendidos / x.cantidad) * multiplier : x.kilosVendidos
          };
        }
        return x;
      })
    );
  };

  const removeFromCart = (cartItemId) => {
    setCartItems(cartItems.filter((x) => x.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
  };

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const cartTotal = cartSubtotal - (cartSubtotal * (discount / 100));

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, discount, setDiscount, cartSubtotal, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};
