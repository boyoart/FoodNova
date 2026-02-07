import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { 
  ArrowLeft, Package, MapPin, Phone, Clock, Upload, 
  CheckCircle, XCircle, FileImage, Loader2 
} from 'lucide-react';
import { getOrder, uploadReceipt, formatPrice } from '../api/store';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

const receiptStatusColors = {
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(location.state?.newOrder || false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await getOrder(id);
        setOrder(data);
      } catch (error) {
        console.error('Failed to load order:', error);
      }
      setLoading(false);
    };
    loadOrder();
  }, [id]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Allowed: PNG, JPG, WEBP, PDF');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large. Maximum size: 10MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      await uploadReceipt(id, file);
      setUploadSuccess(true);
      // Reload order to get updated receipt info
      const updatedOrder = await getOrder(id);
      setOrder(updatedOrder);
    } catch (error) {
      setUploadError(error.response?.data?.detail || 'Failed to upload receipt');
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order not found</h2>
            <Button onClick={() => navigate('/orders')}>View All Orders</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const showReceiptUpload = order.status === 'pending' && !order.has_receipt;

  return (
    <div className="min-h-screen py-8 px-4 bg-secondary/30" data-testid="order-detail-page">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/orders')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        {uploadSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {location.state?.newOrder 
                ? 'Order placed successfully! Please upload your payment receipt.'
                : 'Receipt uploaded successfully! Waiting for admin verification.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order #{order.id}
                  </CardTitle>
                  <Badge className={statusColors[order.status]}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p className="font-medium">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{order.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Delivery Address</p>
                      <p className="font-medium">{order.delivery_address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex justify-between items-center py-3 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{item.name_snapshot}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.unit_price)} x {item.qty}
                        </p>
                      </div>
                      <p className="font-semibold">{formatPrice(item.line_total)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="price-tag text-xl">{formatPrice(order.total_amount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Receipt Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="w-5 h-5" />
                  Payment Receipt
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.has_receipt ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={receiptStatusColors[order.receipt_status]}>
                        {order.receipt_status}
                      </Badge>
                    </div>
                    {order.receipt_status === 'approved' && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Payment verified! Your order is being processed.
                        </AlertDescription>
                      </Alert>
                    )}
                    {order.receipt_status === 'rejected' && (
                      <Alert variant="destructive">
                        <XCircle className="w-4 h-4" />
                        <AlertDescription>
                          Receipt rejected. Please upload a valid receipt.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : showReceiptUpload ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Upload your payment receipt for verification
                    </p>
                    
                    {uploadError && (
                      <Alert variant="destructive">
                        <AlertDescription>{uploadError}</AlertDescription>
                      </Alert>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="receipt-file-input"
                    />
                    
                    <Button
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      data-testid="upload-receipt-btn"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Receipt
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      Accepted: PNG, JPG, WEBP, PDF (max 10MB)
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No receipt required for this order status.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Bank: GTBank
                  </p>
                  <p className="text-muted-foreground">
                    Account: 0123456789
                  </p>
                  <p className="text-muted-foreground">
                    Name: FoodNova Ltd
                  </p>
                  <Separator className="my-3" />
                  <p className="font-medium">
                    Amount: {formatPrice(order.total_amount)}
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

export default OrderDetail;
