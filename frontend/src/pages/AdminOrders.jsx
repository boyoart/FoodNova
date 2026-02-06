import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { ArrowLeft, Search, Eye, Package } from 'lucide-react';
import { adminGetOrders, formatPrice } from '../api/store';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await adminGetOrders();
        setOrders(data);
      } catch (error) {
        console.error('Failed to load orders:', error);
      }
      setLoading(false);
    };
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      order.id.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen py-8 px-4 bg-secondary/30" data-testid="admin-orders-page">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage customer orders</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="orders-search"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40" data-testid="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{order.item_count} items</TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status]}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            asChild
                            data-testid={`view-order-${order.id}`}
                          >
                            <Link to={`/admin/orders/${order.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrders;
