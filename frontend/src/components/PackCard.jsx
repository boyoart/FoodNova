import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Package, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice, getPack } from '../api/store';

export const PackCard = ({ pack }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [packDetails, setPackDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const handleViewDetails = async () => {
    setIsOpen(true);
    if (!packDetails) {
      setLoading(true);
      try {
        const details = await getPack(pack.id);
        setPackDetails(details);
      } catch (error) {
        console.error('Failed to load pack details:', error);
      }
      setLoading(false);
    }
  };

  const handleAddVariant = (variant) => {
    addItem({
      product_id: null,
      pack_variant_id: variant.id,
      name: `${pack.name} - ${variant.name}`,
      price: variant.price,
      image_url: null,
      qty: 1,
    });
    setIsOpen(false);
  };

  return (
    <>
      <Card 
        className="product-card cursor-pointer group"
        onClick={handleViewDetails}
        data-testid={`pack-card-${pack.id}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{pack.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {pack.variant_count} variants
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {pack.description || 'Great value bundle pack'}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          {pack.min_price && (
            <p className="price-tag">
              From {formatPrice(pack.min_price)}
            </p>
          )}
          <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
            View <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg" data-testid="pack-modal">
          <DialogHeader>
            <DialogTitle>{pack.name}</DialogTitle>
            <DialogDescription>{pack.description}</DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : packDetails ? (
            <div className="space-y-4 mt-4">
              {packDetails.variants.map((variant) => (
                <div 
                  key={variant.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                  data-testid={`variant-${variant.id}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{variant.name}</h4>
                      <p className="price-tag text-lg">{formatPrice(variant.price)}</p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleAddVariant(variant)}
                      data-testid={`add-variant-${variant.id}`}
                    >
                      Add to Cart
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Includes:</p>
                    {variant.items.map((item) => (
                      <p key={item.id} className="text-sm">
                        • {item.qty}x {item.product_name}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
