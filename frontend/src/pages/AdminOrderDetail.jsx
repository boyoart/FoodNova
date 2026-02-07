import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  ArrowLeft, Package, MapPin, Phone, Clock, User, Mail,
  FileImage, CheckCircle, XCircle, Loader2, ExternalLink
} from 'lucide-react';
import { 
  adminGetOrder, adminUpdateOrderStatus, adminUpdateReceipt, 
  formatPrice 
} from '../api/store';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await adminGetOrder(id);
        setOrder(data);
        setAdminNote(data.receipt?.admin_note || '');
      } catch (error) {
        console.error('Failed to load order:', error);
      }
      setLoading(false);
    };
    loadOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      await adminUpdateOrderStatus(id, newStatus);
      setOrder({ ...order, status: newStatus });
      setSuccess('Order status updated successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status');
    }
    setUpdating(false);
  };

  const handleReceiptAction = async (action) => {
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      await adminUpdateReceipt(order.receipt.id, {
        status: action,
        admin_note: adminNote,
      });
      const updatedOrder = await adminGetOrder(id);
      setOrder(updatedOrder);
      setSuccess(`Receipt ${action} successfully`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update receipt');
    }
    setUpdating(false);
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
            <Button onClick={() => navigate('/admin/orders')}>View All Orders</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-secondary/30" data-testid="admin-order-detail">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/orders">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Order #{order.id}</h1>
            <p className="text-muted-foreground">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <Badge className={`text-base px-4 py-1 ${statusColors[order.status]}`}>
            {order.status}
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{order.user_name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{order.user_email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{order.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{order.delivery_address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items
                </CardTitle>
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
                          {formatPrice(item.unit_price)} × {item.qty}
                        </p>
                      </div>
                      <p className="font-semibold">{formatPrice(item.line_total)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="price-tag text-2xl">{formatPrice(order.total_amount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={order.status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger data-testid="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Receipt Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="w-5 h-5" />
                  Payment Receipt
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.receipt ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge 
                        className={
                          order.receipt.status === 'approved' ? 'bg-green-100 text-green-800' :
                          order.receipt.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {order.receipt.status}
                      </Badge>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      asChild
                    >
                      <a 
                        href={order.receipt.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        data-testid="view-receipt-btn"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Receipt
                      </a>
                    </Button>

                    {order.receipt.status === 'submitted' && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <Label>Admin Note (Optional)</Label>
                          <Textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Add a note..."
                            rows={3}
                            data-testid="admin-note"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleReceiptAction('rejected')}
                              disabled={updating}
                              data-testid="reject-receipt-btn"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleReceiptAction('approved')}
                              disabled={updating}
                              data-testid="approve-receipt-btn"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {order.receipt.admin_note && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Admin Note:</p>
                        <p className="text-sm">{order.receipt.admin_note}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No receipt uploaded yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            {order.payment && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="capitalize">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge 
                      className={
                        order.payment.status === 'verified' ? 'bg-green-100 text-green-800' :
                        order.payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {order.payment.status}
                    </Badge>
                  </div>
                  {order.payment.reference && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reference</span>
                      <span>{order.payment.reference}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
