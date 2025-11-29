import React, { useState, useEffect } from 'react';
import { Product, User, UserRole, ViewState, CartItem, ProductCategory, Order, OrderStatus } from './types';
import { getProducts, saveProduct, deleteProduct, getSessionUser, setSessionUser, getOrders, saveOrder, updateOrderStatus, addProductReview } from './services/storageService';
import { MOCK_ADMIN, MOCK_USER } from './constants';
import { Button } from './components/Button';
import { ProductCard } from './components/ProductCard';
import { AdminDashboard } from './components/AdminDashboard';
import { ChatAssistant } from './components/ChatAssistant';

const App: React.FC = () => {
  // Global State
  const [view, setView] = useState<ViewState>('HOME');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI State
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  // Checkout State
  const [isCheckout, setIsCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('cod');
  const [orderComplete, setOrderComplete] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Review State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Initialization
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const loadedProducts = await getProducts();
        setProducts(loadedProducts);
        
        const loadedOrders = await getOrders();
        setOrders(loadedOrders);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }

      const session = getSessionUser();
      setUser(session);
    };

    fetchData();
  }, []);

  // Auth Handlers
  const login = (asAdmin: boolean) => {
    const newUser = asAdmin ? MOCK_ADMIN : MOCK_USER;
    setUser(newUser);
    setSessionUser(newUser);
    setView('HOME');
  };

  const logout = () => {
    setUser(null);
    setSessionUser(null);
    setView('LOGIN');
  };

  // Cart Handlers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Checkout Handler
  const handleCheckout = async () => {
    setIsProcessingOrder(true);
    const newOrder: Order = {
      id: Date.now().toString(),
      userId: user?.id || 'guest',
      customerName: user?.name || 'Guest Customer',
      items: [...cart],
      totalAmount: cartTotal,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      paymentMethod: paymentMethod
    };

    try {
      const updatedOrders = await saveOrder(newOrder);
      setOrders(updatedOrders);
      setOrderComplete(true);
      setTimeout(() => {
        setCart([]);
        setOrderComplete(false);
        setIsCheckout(false);
        setView('HOME');
      }, 3000);
    } catch (error) {
      alert("Failed to place order");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Review Handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !user) return;

    setIsSubmittingReview(true);
    try {
      const updatedProduct = await addProductReview(selectedProduct.id, {
        userId: user.id,
        userName: user.name,
        rating: reviewRating,
        comment: reviewComment
      });
      
      // Update local state
      setSelectedProduct(updatedProduct);
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      
      // Reset form
      setReviewComment('');
      setReviewRating(5);
    } catch (error) {
      console.error("Failed to submit review", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Product Admin Handlers
  const handleSaveProduct = async (product: Product) => {
    setIsLoading(true);
    try {
      const updatedList = await saveProduct(product);
      setProducts(updatedList);
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setIsLoading(true);
      try {
        const updatedList = await deleteProduct(id);
        setProducts(updatedList);
      } catch (error) {
        console.error("Delete failed", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setIsLoading(true);
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders(updated);
    } catch (error) {
      console.error("Update status failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // --- Views ---

  const renderNavbar = () => (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('HOME')}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-secondary">
            <i className="fas fa-music"></i>
          </div>
          <span className="text-xl font-bold text-primary tracking-tight">Melody<span className="text-accent">Mart</span></span>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
          <input
            type="text"
            placeholder="Search instruments..."
            className="w-full bg-gray-100 border-none rounded-full px-5 py-2 pl-10 focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (view !== 'HOME') setView('HOME');
            }}
          />
          <i className="fas fa-search absolute left-3.5 top-3 text-gray-400 text-xs"></i>
        </div>

        <div className="flex items-center space-x-4">
          {/* Mobile Search Toggle */}
          <button 
            className="md:hidden text-gray-600 hover:text-accent focus:outline-none"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          >
            <i className={`fas ${isMobileSearchOpen ? 'fa-times' : 'fa-search'} text-xl`}></i>
          </button>

          <div className="relative cursor-pointer" onClick={() => setView('CART')}>
            <i className="fas fa-shopping-bag text-gray-600 hover:text-accent text-xl transition-colors"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                {cartCount}
              </span>
            )}
          </div>
          
          {user ? (
            <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Welcome,</p>
                <p className="text-sm font-bold text-gray-900 leading-none">{user.name}</p>
              </div>
              <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full border border-gray-200" />
              {user.role === UserRole.ADMIN && (
                <button 
                  onClick={() => setView('ADMIN_DASHBOARD')}
                  className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-700 ml-2"
                >
                  Admin
                </button>
              )}
              <button onClick={logout} className="text-gray-400 hover:text-red-500 ml-1">
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setView('LOGIN')}>Login</Button>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-4 animate-in slide-in-from-top-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search instruments..."
              className="w-full bg-gray-100 border-none rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-accent outline-none text-sm"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (view !== 'HOME') setView('HOME');
              }}
              autoFocus
            />
            <i className="fas fa-search absolute left-3 top-3 text-gray-400 text-xs"></i>
          </div>
        </div>
      )}
    </nav>
  );

  const renderHome = () => (
    <div className="container mx-auto px-4 py-8">
      {/* Categories */}
      <div className="flex overflow-x-auto space-x-2 pb-6 no-scrollbar mb-4">
        {['All', ...Object.values(ProductCategory)].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat 
                ? 'bg-primary text-white shadow-lg shadow-indigo-200' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-accent hover:text-accent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && products.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <i className="fas fa-circle-notch fa-spin text-4xl text-primary"></i>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={addToCart}
              onViewDetails={(p) => { setSelectedProduct(p); setView('PRODUCT_DETAILS'); }}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-block p-6 rounded-full bg-gray-100 mb-4">
            <i className="fas fa-search text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-900">No instruments found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or category filters.</p>
        </div>
      )}
    </div>
  );

  const renderProductDetails = () => {
    if (!selectedProduct) return null;
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => setView('HOME')} className="mb-6 pl-0 hover:bg-transparent hover:text-accent">
          <i className="fas fa-arrow-left mr-2"></i> Back to Shop
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-2xl p-8 shadow-sm">
          <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
            <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover max-h-[500px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-accent font-semibold tracking-wider text-sm uppercase mb-2">{selectedProduct.category}</span>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{selectedProduct.name}</h1>
            <div className="flex items-center mb-6">
              <div className="flex text-secondary mr-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fas fa-star ${i < Math.round(selectedProduct.rating) ? '' : 'text-gray-300'}`}></i>
                ))}
              </div>
              <span className="text-gray-500">{selectedProduct.rating} ({selectedProduct.reviews?.length || 0} reviews)</span>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">{selectedProduct.description}</p>
            <div className="flex items-center justify-between border-t border-b border-gray-100 py-6 mb-8">
              <span className="text-3xl font-bold text-gray-900">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${selectedProduct.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </div>
            </div>
            <div className="flex space-x-4">
              <Button size="lg" className="flex-1" onClick={() => addToCart(selectedProduct)}>Add to Cart</Button>
              <Button size="lg" variant="ghost" className="border border-gray-200">
                <i className="far fa-heart"></i>
              </Button>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Reviews List */}
            <div className="md:col-span-2 space-y-6">
              {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? (
                selectedProduct.reviews.map(review => (
                  <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold mr-3">
                          {review.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{review.userName}</p>
                          <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex text-secondary text-sm">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`fas fa-star ${i < review.rating ? '' : 'text-gray-200'}`}></i>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>

            {/* Add Review Form */}
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-xl border border-gray-100 sticky top-24">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Write a Review</h3>
                {!user ? (
                  <div className="text-center py-6">
                     <p className="text-gray-600 mb-4 text-sm">Please login to write a review.</p>
                     <Button size="sm" onClick={() => setView('LOGIN')}>Login Now</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className={`text-2xl focus:outline-none transition-colors ${star <= reviewRating ? 'text-secondary' : 'text-gray-200 hover:text-secondary'}`}
                          >
                            <i className="fas fa-star"></i>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Share your experience with this instrument..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none resize-none"
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                      ></textarea>
                    </div>
                    <Button type="submit" className="w-full" isLoading={isSubmittingReview}>
                      Submit Review
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCheckout = () => {
    if (orderComplete) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-2xl text-green-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
            <div className="inline-block bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-700">
               Payment Method: <strong>{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card'}</strong>
            </div>
            <p className="text-xs text-gray-400 mt-4">Redirecting to home...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
            <button onClick={() => setIsCheckout(false)} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
               <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Summary</h3>
               <div className="flex justify-between items-center text-lg font-medium text-gray-900">
                 <span>Total Amount</span>
                 <span>₹{cartTotal.toLocaleString('en-IN')}</span>
               </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Method</h3>
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-accent bg-indigo-50 ring-1 ring-accent' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod" 
                    checked={paymentMethod === 'cod'} 
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-accent focus:ring-accent border-gray-300"
                  />
                  <div className="ml-3 flex items-center">
                    <i className="fas fa-money-bill-wave text-green-600 text-lg mr-3"></i>
                    <div>
                      <span className="block font-medium text-gray-900">Cash on Delivery</span>
                      <span className="block text-xs text-gray-500">Pay when your order arrives</span>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-accent bg-indigo-50 ring-1 ring-accent' : 'border-gray-200 hover:border-gray-300'}`}>
                   <input 
                    type="radio" 
                    name="payment" 
                    value="card" 
                    checked={paymentMethod === 'card'} 
                    onChange={() => setPaymentMethod('card')}
                    className="w-4 h-4 text-accent focus:ring-accent border-gray-300"
                  />
                  <div className="ml-3 flex items-center">
                    <i className="fas fa-credit-card text-gray-600 text-lg mr-3"></i>
                    <div>
                      <span className="block font-medium text-gray-900">Credit / Debit Card</span>
                      <span className="block text-xs text-gray-500">Secure online payment</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <Button size="lg" className="w-full" onClick={handleCheckout} isLoading={isProcessingOrder}>
              Confirm Order - ₹{cartTotal.toLocaleString('en-IN')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderCart = () => (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <i className="fas fa-shopping-cart mr-3 text-accent"></i> Your Cart
      </h2>
      {cart.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg mb-4">Your cart is empty.</p>
          <Button onClick={() => setView('HOME')}>Start Shopping</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {cart.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row items-center p-6 border-b border-gray-100 last:border-0">
              <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg mb-4 sm:mb-0 sm:mr-6" />
              <div className="flex-grow text-center sm:text-left mb-4 sm:mb-0">
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <p className="text-gray-500 text-sm">{item.category}</p>
              </div>
              <div className="flex items-center space-x-4 sm:space-x-8">
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 hover:bg-gray-100 text-gray-600">-</button>
                  <span className="px-3 py-1 font-medium min-w-[2rem] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 hover:bg-gray-100 text-gray-600">+</button>
                </div>
                <span className="font-bold text-gray-900 w-24 text-right">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          ))}
          <div className="bg-gray-50 p-6 flex flex-col sm:flex-row justify-between items-center">
            <Button variant="ghost" onClick={() => setView('HOME')} className="mb-4 sm:mb-0">Continue Shopping</Button>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-primary mb-4">₹{cartTotal.toLocaleString('en-IN')}</p>
              <Button size="lg" className="w-full sm:w-auto" onClick={() => setIsCheckout(true)}>
                Checkout Now <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-secondary text-2xl mx-auto mb-6">
          <i className="fas fa-music"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-500 mb-8">Select a role to simulate login (MERN Auth Demo)</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => login(false)}
            className="w-full p-4 border border-gray-200 rounded-xl hover:border-accent hover:bg-indigo-50 transition-all flex items-center group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-indigo-100 group-hover:text-accent mr-4">
              <i className="fas fa-user"></i>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Customer Login</p>
              <p className="text-xs text-gray-500">Shop for instruments</p>
            </div>
            <i className="fas fa-chevron-right ml-auto text-gray-300 group-hover:text-accent"></i>
          </button>

          <button 
            onClick={() => login(true)}
            className="w-full p-4 border border-gray-200 rounded-xl hover:border-accent hover:bg-indigo-50 transition-all flex items-center group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-indigo-100 group-hover:text-accent mr-4">
              <i className="fas fa-user-shield"></i>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Admin Login</p>
              <p className="text-xs text-gray-500">Manage products</p>
            </div>
            <i className="fas fa-chevron-right ml-auto text-gray-300 group-hover:text-accent"></i>
          </button>
        </div>
        
        <p className="mt-8 text-xs text-gray-400">
          Note: This is a frontend demo. The backend code is available in the <code>server/</code> folder.
        </p>
      </div>
    </div>
  );

  // Main Render
  if (view === 'LOGIN') return renderLogin();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {renderNavbar()}
      
      <main className="flex-grow">
        {view === 'HOME' && renderHome()}
        {view === 'PRODUCT_DETAILS' && renderProductDetails()}
        {view === 'CART' && renderCart()}
        {view === 'ADMIN_DASHBOARD' && user?.role === UserRole.ADMIN && (
          <AdminDashboard 
            products={products} 
            orders={orders}
            onSave={handleSaveProduct} 
            onDelete={handleDeleteProduct}
            onUpdateOrder={handleUpdateOrderStatus}
          />
        )}
      </main>

      {/* Checkout Modal */}
      {isCheckout && renderCheckout()}

      <footer className="bg-white border-t border-gray-100 py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-secondary text-xs">
                  <i className="fas fa-music"></i>
                </div>
                <span className="text-lg font-bold text-primary">MelodyMart</span>
              </div>
              <p className="text-gray-500 text-sm">Your premier destination for musical instruments. Powered by AI.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Guitars</li>
                <li>Keyboards</li>
                <li>Drums</li>
                <li>Accessories</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Contact Us</li>
                <li>FAQs</li>
                <li>Shipping</li>
                <li>Returns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Newsletter</h4>
              <div className="flex">
                <input type="email" placeholder="Email" className="bg-gray-100 rounded-l-lg px-3 py-2 text-sm w-full focus:outline-none" />
                <button className="bg-primary text-white px-3 py-2 rounded-r-lg text-sm hover:bg-indigo-900">Sub</button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
            © 2024 MelodyMart. Demo Application.
          </div>
        </div>
      </footer>

      {/* AI Assistant - Always available unless in login */}
      <ChatAssistant products={products} />
    </div>
  );
};

export default App;