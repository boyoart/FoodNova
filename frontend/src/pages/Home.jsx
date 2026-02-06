import React, { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Truck, Shield, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ProductCard } from '../components/ProductCard';
import { PackCard } from '../components/PackCard';
import { getProducts, getCategories, getPacks } from '../api/store';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [packs, setPacks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData, packsData] = await Promise.all([
          getProducts(),
          getCategories(),
          getPacks(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
        setPacks(packsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Fresh & Quality Groceries
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Quality Food,
                <span className="text-primary"> Delivered Fresh</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Shop premium groceries and food items. From rice to oil, noodles to spices - 
                get everything you need delivered to your doorstep.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="btn-glow"
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="shop-now-btn"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => document.getElementById('packs')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="view-packs-btn"
                >
                  View Packs
                </Button>
              </div>
            </div>
            <div className="hidden lg:block animate-fade-in stagger-2">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=500&fit=crop"
                  alt="Fresh groceries"
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 animate-slide-in">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Fast Delivery</p>
                      <p className="text-xs text-muted-foreground">Same day delivery</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: ShoppingBag, title: 'Fresh Products', desc: 'Quality guaranteed' },
              { icon: Truck, title: 'Fast Delivery', desc: 'To your doorstep' },
              { icon: Shield, title: 'Secure Payment', desc: 'Safe transactions' },
              { icon: Sparkles, title: 'Best Prices', desc: 'Value for money' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Our Products</h2>
              <p className="text-muted-foreground">Browse our selection of quality groceries</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                data-testid="category-all"
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  data-testid={`category-${cat.id}`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-muted animate-pulse rounded-xl h-80"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, idx) => (
                <div key={product.id} className={`animate-fade-in stagger-${(idx % 4) + 1}`}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Packs Section */}
      <section id="packs" className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Save More</Badge>
            <h2 className="text-3xl font-bold mb-2">Bundle Packs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get more value with our curated bundle packs. Perfect for families and regular shoppers.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted animate-pulse rounded-xl h-48"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packs.map((pack, idx) => (
                <div key={pack.id} className={`animate-fade-in stagger-${(idx % 3) + 1}`}>
                  <PackCard pack={pack} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                FoodNova
              </h3>
              <p className="text-white/70 text-sm">
                Quality groceries delivered fresh to your doorstep. Your trusted partner for everyday essentials.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#products" className="hover:text-white">Products</a></li>
                <li><a href="#packs" className="hover:text-white">Packs</a></li>
                <li><a href="/orders" className="hover:text-white">My Orders</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>support@foodnova.com</li>
                <li>Lagos, Nigeria</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/70">
            © 2024 FoodNova. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
