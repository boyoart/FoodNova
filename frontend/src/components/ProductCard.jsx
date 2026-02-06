import React from 'react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../api/store';

export const ProductCard = ({ product }) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      pack_variant_id: null,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      qty: 1,
    });
  };

  const isOutOfStock = product.stock_qty <= 0;

  return (
    <Card 
      className="product-card overflow-hidden group"
      data-testid={`product-card-${product.id}`}
    >
      <div className="aspect-square relative overflow-hidden bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}
        {product.category_name && (
          <Badge 
            className="absolute top-3 left-3 bg-white/90 text-primary"
            variant="secondary"
          >
            {product.category_name}
          </Badge>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {product.stock_qty > 0 ? `${product.stock_qty} in stock` : 'Out of stock'}
        </p>
        <p className="price-tag text-xl">{formatPrice(product.price)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full btn-glow"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          data-testid={`add-to-cart-${product.id}`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};
