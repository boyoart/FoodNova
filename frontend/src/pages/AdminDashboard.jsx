import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Package, ShoppingBag, Users, TrendingUp, 
  ArrowRight, Clock, AlertCircle 
} from 'lucide-react';
import { adminGetOrders, adminGetProducts, formatPrice } from '../api/store';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, productsData] = await Promise.all([
          adminGetOrders(),
          adminGetProducts(),
        ]);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const lowStockProducts = products.filter((p) => p.stock_qty < 20 && p.is_active);

  const stats = [
    { 
      title: 'Total Orders', 
      value: orders.length, 
      icon: Package, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Pending Orders', 
      value: pendingOrders.length, 
      icon: Clock, 
      color: 'bg-yellow-500' 
    },
    { 
      title: 'Total Revenue', 
      value: formatPrice(totalRevenue), 
      icon: TrendingUp, 
      color: 'bg-green-500' 
    },
    { 
      title: 'Products', 
      value: products.filter((p) => p.is_active).length, 
      icon: ShoppingBag, 
      color: 'bg-purple-500' 
    },
  ];

  return (
    <div className="min-h-screen py-8 px-4 bg-secondary/30" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome to FoodNova Admin Panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/orders">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      to={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.item_count} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {order.status}
                        </Badge>
                        <p className="text-sm font-semibold mt-1">
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Low Stock Alert
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/products">
                  Manage <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                  ))}
                </div>
              ) : lowStockProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">All products well stocked!</p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.category_name || 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        {product.stock_qty} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link to="/admin/orders" className="flex flex-col items-center gap-2">
              <Package className="w-6 h-6" />
              <span>View Orders</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link to="/admin/products" className="flex flex-col items-center gap-2">
              <ShoppingBag className="w-6 h-6" />
              <span>Manage Products</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link to="/" className="flex flex-col items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              <span>View Store</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link to="/admin/orders?status=pending" className="flex flex-col items-center gap-2">
              <Clock className="w-6 h-6" />
              <span>Pending Orders</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
