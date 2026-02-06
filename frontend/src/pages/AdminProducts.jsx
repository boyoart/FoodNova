import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  ArrowLeft, Search, Plus, Pencil, Trash2, 
  ShoppingBag, Package, CheckCircle, Loader2 
} from 'lucide-react';
import { 
  adminGetProducts, adminCreateProduct, adminUpdateProduct, 
  adminDeleteProduct, getCategories, formatPrice 
} from '../api/store';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock_qty: '',
    image_url: '',
    category_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        adminGetProducts(),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
    setLoading(false);
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock_qty: product.stock_qty.toString(),
        image_url: product.image_url || '',
        category_id: product.category_id?.toString() || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        stock_qty: '',
        image_url: '',
        category_id: '',
      });
    }
    setIsDialogOpen(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const data = {
        name: formData.name,
        price: parseInt(formData.price),
        stock_qty: parseInt(formData.stock_qty),
        image_url: formData.image_url || null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      };

      if (editingProduct) {
        await adminUpdateProduct(editingProduct.id, data);
        setSuccess('Product updated successfully');
      } else {
        await adminCreateProduct(data);
        setSuccess('Product created successfully');
      }

      await loadData();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save product');
    }
    setSaving(false);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await adminDeleteProduct(productId);
      setSuccess('Product deleted successfully');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen py-8 px-4 bg-secondary/30" data-testid="admin-products-page">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          <Button onClick={() => handleOpenDialog()} data-testid="add-product-btn">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="products-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{product.category_name || '-'}</TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(product.price)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={product.stock_qty < 20 ? 'destructive' : 'secondary'}
                          >
                            {product.stock_qty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(product)}
                              data-testid={`edit-product-${product.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDelete(product.id)}
                              data-testid={`delete-product-${product.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent data-testid="product-dialog">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  data-testid="product-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    data-testid="product-price-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_qty">Stock Quantity</Label>
                  <Input
                    id="stock_qty"
                    name="stock_qty"
                    type="number"
                    min="0"
                    value={formData.stock_qty}
                    onChange={handleChange}
                    required
                    data-testid="product-stock-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  data-testid="product-category-select"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL (Optional)</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  data-testid="product-image-input"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} data-testid="save-product-btn">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingProduct ? (
                    'Update Product'
                  ) : (
                    'Create Product'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminProducts;
