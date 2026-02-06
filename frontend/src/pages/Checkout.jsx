import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, CreditCard, MapPin, Phone, ShoppingBag } from 'lucide-react';
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
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.product_id,
          pack_variant_id: item.pack_variant_id,
          qty: item.qty,
        })),
        delivery_address: formData.delivery_address,
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
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Information
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
                    <Label htmlFor="phone">Phone Number</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="delivery_address">Delivery Address</Label>
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

          {/* Order Summary */}
          <div>
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
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="price-tag text-lg">{formatPrice(totalAmount)}</span>
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
