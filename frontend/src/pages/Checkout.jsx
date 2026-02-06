import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, CreditCard, MapPin, Phone, ShoppingBag, Truck, Store, Headphones } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder, formatPrice } from '../api/store';

const Checkout = () => {
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    delivery_address: '',
    phone: '',
    payment_method: 'etransfer',
    delivery_type: 'delivery',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // For pickup, set a default address
    const address = formData.delivery_type === 'pickup' 
      ? 'PICKUP - ' + (formData.delivery_address || 'Customer will pick up from store')
      : formData.delivery_address;

    if (formData.delivery_type === 'delivery' && !formData.delivery_address.trim()) {
      setError('Please enter your delivery address');
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.product_id,
          pack_variant_id: item.pack_variant_id,
          qty: item.qty,
        })),
        delivery_address: address,
        phone: formData.phone,
        payment_method: formData.payment_method,
      };

      const order = await createOrder(orderData);
      clearCart();
      navigate(`/orders/${order.id}`, { state: { newOrder: true } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order. Please try again.');
    }
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" data-testid="checkout-empty">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some items to proceed to checkout</p>
            <Button onClick={() => navigate('/')}>Continue Shopping</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-secondary/30" data-testid="checkout-page">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Option
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.delivery_type === 'pickup'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_type"
                      value="pickup"
                      checked={formData.delivery_type === 'pickup'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <Store className={`w-8 h-8 ${formData.delivery_type === 'pickup' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-center">
                      <p className="font-semibold">Pickup</p>
                      <p className="text-xs text-muted-foreground">Collect from store</p>
                      <p className="text-sm font-medium text-primary mt-1">Free</p>
                    </div>
                  </label>

                  <label
                    className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.delivery_type === 'delivery'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_type"
                      value="delivery"
                      checked={formData.delivery_type === 'delivery'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <Truck className={`w-8 h-8 ${formData.delivery_type === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-center">
                      <p className="font-semibold">Delivery</p>
                      <p className="text-xs text-muted-foreground">To your doorstep</p>
                      <p className="text-sm font-medium text-orange-600 mt-1">Pay on delivery</p>
                    </div>
                  </label>
                </div>

                {formData.delivery_type === 'delivery' && (
                  <Alert className="mt-4 bg-orange-50 border-orange-200">
                    <Truck className="w-4 h-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Delivery fee will be calculated based on your location and paid upon delivery.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {formData.delivery_type === 'pickup' ? 'Contact Information' : 'Delivery Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+234 xxx xxx xxxx"
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-10"
                        required
                        data-testid="checkout-phone"
                      />
                    </div>
                  </div>

                  {formData.delivery_type === 'delivery' ? (
                    <div className="space-y-2">
                      <Label htmlFor="delivery_address">Delivery Address *</Label>
                      <Textarea
                        id="delivery_address"
                        name="delivery_address"
                        placeholder="Enter your full delivery address..."
                        value={formData.delivery_address}
                        onChange={handleChange}
                        rows={3}
                        required
                        data-testid="checkout-address"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-medium text-sm">Pickup Location</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        FoodNova Store<br />
                        123 Main Street, Lagos, Nigeria<br />
                        Open: Mon-Sat 8AM - 8PM
                      </p>
                    </div>
                  )}

                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payment Method
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'etransfer', label: 'Bank Transfer' },
                        { id: 'bank', label: 'Bank Deposit' },
                      ].map((method) => (
                        <label
                          key={method.id}
                          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            formData.payment_method === method.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            value={method.id}
                            checked={formData.payment_method === method.id}
                            onChange={handleChange}
                            className="text-primary"
                          />
                          <span className="text-sm font-medium">{method.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      After placing order, upload your payment receipt for verification
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6"
                    size="lg"
                    disabled={loading}
                    data-testid="place-order-btn"
                  >
                    {loading ? 'Placing Order...' : `Place Order - ${formatPrice(totalAmount)}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Support */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} x{item.qty}
                    </span>
                    <span>{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                {formData.delivery_type === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="text-orange-600">Pay on delivery</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="price-tag text-lg">{formatPrice(totalAmount)}</span>
                </div>
                {formData.delivery_type === 'delivery' && (
                  <p className="text-xs text-muted-foreground text-center">
                    + Delivery fee (paid upon delivery)
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Customer Support */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Need Help?</p>
                    <p className="text-xs text-muted-foreground">Our support team is here for you</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <a href="tel:+2348148242485" className="text-primary font-medium">08148242485</a>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">WhatsApp:</span>
                    <a href="https://wa.me/2348148242485" target="_blank" rel="noopener noreferrer" className="text-primary font-medium">08148242485</a>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <a href="mailto:support@foodnova.com" className="text-primary font-medium">support@foodnova.com</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
