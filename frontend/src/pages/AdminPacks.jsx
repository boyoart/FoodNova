import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { 
  ArrowLeft, Plus, Pencil, Trash2, Package, CheckCircle, 
  Loader2, ChevronDown, X
} from 'lucide-react';
import { 
  adminGetPacks, adminCreatePack, adminUpdatePack, adminDeletePack,
  adminAddVariant, adminUpdateVariant, adminDeleteVariant,
  adminAddVariantItem, adminDeleteVariantItem,
  adminGetProducts, formatPrice 
} from '../api/store';

const AdminPacks = () => {
  const [packs, setPacks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pack dialog state
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  const [packForm, setPackForm] = useState({ name: '', description: '', is_active: true });
  
  // Variant dialog state
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [variantForm, setVariantForm] = useState({ name: '', price: '', items: [] });
  
  // Item dialog state
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [itemForm, setItemForm] = useState({ product_id: '', qty: '1' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packsData, productsData] = await Promise.all([
        adminGetPacks(),
        adminGetProducts(),
      ]);
      setPacks(packsData);
      setProducts(productsData.filter(p => p.is_active));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  // Pack handlers
  const handleOpenPackDialog = (pack = null) => {
    if (pack) {
      setEditingPack(pack);
      setPackForm({ name: pack.name, description: pack.description || '', is_active: pack.is_active });
    } else {
      setEditingPack(null);
      setPackForm({ name: '', description: '', is_active: true });
    }
    setIsPackDialogOpen(true);
    setError('');
  };

  const handleSavePack = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingPack) {
        await adminUpdatePack(editingPack.id, packForm);
        setSuccess('Pack updated successfully');
      } else {
        await adminCreatePack(packForm);
        setSuccess('Pack created successfully');
      }
      await loadData();
      setIsPackDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save pack');
    }
    setSaving(false);
  };

  const handleDeletePack = async (packId) => {
    if (!window.confirm('Are you sure you want to delete this pack and all its variants?')) return;
    try {
      await adminDeletePack(packId);
      setSuccess('Pack deleted successfully');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete pack');
    }
  };

  // Variant handlers
  const handleOpenVariantDialog = (packId, variant = null) => {
    setSelectedPackId(packId);
    if (variant) {
      setEditingVariant(variant);
      setVariantForm({ name: variant.name, price: variant.price.toString(), items: variant.items || [] });
    } else {
      setEditingVariant(null);
      setVariantForm({ name: '', price: '', items: [] });
    }
    setIsVariantDialogOpen(true);
    setError('');
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingVariant) {
        await adminUpdateVariant(editingVariant.id, { 
          name: variantForm.name, 
          price: parseInt(variantForm.price) 
        });
        setSuccess('Variant updated successfully');
      } else {
        await adminAddVariant(selectedPackId, {
          name: variantForm.name,
          price: parseInt(variantForm.price),
          items: variantForm.items.map(i => ({ product_id: i.product_id, qty: i.qty }))
        });
        setSuccess('Variant added successfully');
      }
      await loadData();
      setIsVariantDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save variant');
    }
    setSaving(false);
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Delete this variant?')) return;
    try {
      await adminDeleteVariant(variantId);
      setSuccess('Variant deleted');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete variant');
    }
  };

  // Item handlers
  const handleOpenItemDialog = (variantId) => {
    setSelectedVariantId(variantId);
    setItemForm({ product_id: '', qty: '1' });
    setIsItemDialogOpen(true);
    setError('');
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminAddVariantItem(selectedVariantId, {
        product_id: parseInt(itemForm.product_id),
        qty: parseInt(itemForm.qty)
      });
      setSuccess('Item added');
      await loadData();
      setIsItemDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add item');
    }
    setSaving(false);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await adminDeleteVariantItem(itemId);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete item');
    }
  };

  // Add item to new variant form
  const addItemToVariantForm = () => {
    if (!itemForm.product_id) return;
    const product = products.find(p => p.id === parseInt(itemForm.product_id));
    if (!product) return;
    
    setVariantForm(prev => ({
      ...prev,
      items: [...prev.items, { 
        product_id: parseInt(itemForm.product_id), 
        product_name: product.name,
        qty: parseInt(itemForm.qty) || 1 
      }]
    }));
    setItemForm({ product_id: '', qty: '1' });
  };

  const removeItemFromVariantForm = (index) => {
    setVariantForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-secondary/30" data-testid="admin-packs-page">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Bundle Packs</h1>
            <p className="text-muted-foreground">Manage your bundle packs and variants</p>
          </div>
          <Button onClick={() => handleOpenPackDialog()} data-testid="add-pack-btn">
            <Plus className="w-4 h-4 mr-2" />
            Add Pack
          </Button>
        </div>

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : packs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No packs yet</h2>
              <p className="text-muted-foreground mb-4">Create bundle packs to offer customers more value</p>
              <Button onClick={() => handleOpenPackDialog()}>Create First Pack</Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {packs.map((pack) => (
              <AccordionItem 
                key={pack.id} 
                value={`pack-${pack.id}`}
                className="border rounded-xl bg-card px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{pack.name}</h3>
                        <Badge className={pack.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {pack.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pack.variant_count} variant{pack.variant_count !== 1 ? 's' : ''} • {pack.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenPackDialog(pack)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeletePack(pack.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    {pack.variants.map((variant) => (
                      <div key={variant.id} className="border rounded-lg p-4 bg-secondary/30">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{variant.name}</h4>
                            <p className="text-primary font-bold">{formatPrice(variant.price)}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenVariantDialog(pack.id, variant)}>
                              <Pencil className="w-3 h-3 mr-1" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteVariant(variant.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Items included:</p>
                          {variant.items.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No items added</p>
                          ) : (
                            variant.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm bg-background rounded px-2 py-1">
                                <span>{item.qty}x {item.product_name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem(item.id)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))
                          )}
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => handleOpenItemDialog(variant.id)}>
                            <Plus className="w-3 h-3 mr-1" /> Add Item
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => handleOpenVariantDialog(pack.id)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Variant
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Pack Dialog */}
        <Dialog open={isPackDialogOpen} onOpenChange={setIsPackDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPack ? 'Edit Pack' : 'Create New Pack'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSavePack} className="space-y-4">
              <div className="space-y-2">
                <Label>Pack Name</Label>
                <Input
                  value={packForm.name}
                  onChange={(e) => setPackForm({ ...packForm, name: e.target.value })}
                  placeholder="e.g., Family Pack"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={packForm.description}
                  onChange={(e) => setPackForm({ ...packForm, description: e.target.value })}
                  placeholder="Pack description..."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={packForm.is_active}
                  onChange={(e) => setPackForm({ ...packForm, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active (visible to customers)</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPackDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingPack ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Variant Dialog */}
        <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveVariant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Variant Name</Label>
                  <Input
                    value={variantForm.name}
                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                    placeholder="e.g., Basic, Premium"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₦)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              {!editingVariant && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label>Items in this variant</Label>
                    {variantForm.items.length > 0 && (
                      <div className="space-y-2">
                        {variantForm.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-secondary rounded px-3 py-2 text-sm">
                            <span>{item.qty}x {item.product_name}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItemFromVariantForm(idx)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <select
                        value={itemForm.product_id}
                        onChange={(e) => setItemForm({ ...itemForm, product_id: e.target.value })}
                        className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="1"
                        value={itemForm.qty}
                        onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })}
                        className="w-20"
                        placeholder="Qty"
                      />
                      <Button type="button" variant="outline" onClick={addItemToVariantForm}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsVariantDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingVariant ? 'Update' : 'Add Variant'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Item Dialog */}
        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Item to Variant</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <select
                  value={itemForm.product_id}
                  onChange={(e) => setItemForm({ ...itemForm, product_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} - {formatPrice(p.price)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={itemForm.qty}
                  onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPacks;
