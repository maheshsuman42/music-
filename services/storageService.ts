import { Product, User, Order, OrderStatus, Review } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

// CONFIGURATION
const USE_MOCK_BACKEND = true; // Set to false to use the Node.js backend
const API_URL = 'http://localhost:5000/api';

const PRODUCTS_KEY = 'melodymart_products';
const USER_KEY = 'melodymart_user';
const ORDERS_KEY = 'melodymart_orders';

// Helper for simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- PRODUCTS ---

export const getProducts = async (): Promise<Product[]> => {
  if (!USE_MOCK_BACKEND) {
    const res = await fetch(`${API_URL}/products`);
    return res.json();
  }

  // Mock Implementation
  await delay(500);
  const stored = localStorage.getItem(PRODUCTS_KEY);
  if (!stored) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(stored);
};

export const saveProduct = async (product: Product): Promise<Product[]> => {
  if (!USE_MOCK_BACKEND) {
    const method = product.id && !product.id.toString().startsWith('temp') ? 'PUT' : 'POST';
    const url = method === 'PUT' ? `${API_URL}/products/${product.id}` : `${API_URL}/products`;
    
    // Create new product if ID is temporary or missing
    if (method === 'POST') delete (product as any).id;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return getProducts(); // Return fresh list
  }

  // Mock Implementation
  await delay(500);
  const products = await getProducts();
  const existingIndex = products.findIndex(p => p.id === product.id);
  
  let newProducts;
  if (existingIndex >= 0) {
    newProducts = [...products];
    newProducts[existingIndex] = product;
  } else {
    // Ensure ID is set for new mock products
    const newProduct = { ...product, id: product.id || Date.now().toString() };
    newProducts = [...products, newProduct];
  }
  
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
  return newProducts;
};

export const deleteProduct = async (id: string): Promise<Product[]> => {
  if (!USE_MOCK_BACKEND) {
    await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    return getProducts();
  }

  // Mock Implementation
  await delay(300);
  const products = await getProducts();
  const newProducts = products.filter(p => p.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
  return newProducts;
};

export const addProductReview = async (productId: string, review: Omit<Review, 'id' | 'date'>): Promise<Product> => {
  if (!USE_MOCK_BACKEND) {
    const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    return res.json();
  }

  // Mock Implementation
  await delay(600);
  const products = await getProducts();
  const productIndex = products.findIndex(p => p.id === productId);
  
  if (productIndex === -1) throw new Error("Product not found");

  const product = products[productIndex];
  const newReview: Review = {
    ...review,
    id: Date.now().toString(),
    date: new Date().toISOString()
  };

  const updatedReviews = [...(product.reviews || []), newReview];
  const newRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;

  const updatedProduct = {
    ...product,
    reviews: updatedReviews,
    rating: Number(newRating.toFixed(1))
  };

  products[productIndex] = updatedProduct;
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  
  return updatedProduct;
};

// --- USER ---

export const getSessionUser = (): User | null => {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const setSessionUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

// --- ORDERS ---

export const getOrders = async (): Promise<Order[]> => {
  if (!USE_MOCK_BACKEND) {
    const res = await fetch(`${API_URL}/orders`);
    return res.json();
  }

  await delay(500);
  const stored = localStorage.getItem(ORDERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveOrder = async (order: Order): Promise<Order[]> => {
  if (!USE_MOCK_BACKEND) {
    const cleanOrder = { ...order };
    delete (cleanOrder as any).id; // Let Mongo generate ID
    await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanOrder)
    });
    return getOrders();
  }

  await delay(800);
  const orders = await getOrders();
  const newOrders = [order, ...orders];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(newOrders));
  return newOrders;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order[]> => {
  if (!USE_MOCK_BACKEND) {
    await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return getOrders();
  }

  await delay(300);
  const orders = await getOrders();
  const newOrders = orders.map(o => o.id === orderId ? { ...o, status } : o);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(newOrders));
  return newOrders;
};