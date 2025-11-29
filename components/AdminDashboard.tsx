import React, { useState } from 'react';
import { Product, ProductCategory, Order, OrderStatus } from '../types';
import { Button } from './Button';
import { generateProductDescription } from '../services/geminiService';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  onSave: (product: Product) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateOrder: (id: string, status: OrderStatus) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, orders, onSave, onDelete, onUpdateOrder }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});

  const handleEdit = (product: Product) => {
    setCurrentProduct({ ...product });
    setIsEditing(true);
  };

  const handleNew = () => {
    setCurrentProduct({
      id: `temp-${Date.now()}`, // Temporary ID for new products
      name: '',
      price: 0,
      description: '',
      category: ProductCategory.GUITAR,
      image: 'https://images.unsplash.com/photo-1550291652-6ea9114a47b1?auto=format&fit=crop&q=80&w=500',
      rating: 5,
      stock: 10
    });
    setIsEditing(true);
  };

  const handleGenerateDescription = async () => {
    if (!currentProduct.name || !currentProduct.category) return;
    
    setIsGenerating(true);
    const desc = await generateProductDescription(currentProduct.name, currentProduct.category);
    setCurrentProduct(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProduct.name) {
      setIsSaving(true);
      await onSave(currentProduct as Product);
      setIsSaving(false);
      setIsEditing(false);
      setCurrentProduct({});
    }
  };

  const handlePrintBill = (order: Order) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      const billContent = `
        <html>
          <head>
            <title>Invoice #${order.id}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              .header { border-bottom: 2px solid #eee; margin-bottom: 20px; padding-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #1e1b4b; }
              .meta { display: flex; justify-content: space-between; margin-bottom: 40px; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .table th { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; background: #f9f9f9; }
              .table td { padding: 10px; border-bottom: 1px solid #eee; }
              .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">MelodyMart</div>
              <p>123 Music Lane, Harmony City, 400001</p>
            </div>
            
            <div class="meta">
              <div>
                <strong>Billed To:</strong><br/>
                ${order.customerName}<br/>
                ${order.userId === 'guest' ? 'Guest Customer' : 'Registered User'}
              </div>
              <div style="text-align: right;">
                <strong>Invoice #:</strong> ${order.id}<br/>
                <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br/>
                <strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toLocaleString('en-IN')}</td>
                    <td>₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total">
              Total: ₹${order.totalAmount.toLocaleString('en-IN')}
            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>For support, contact support@melodymart.com</p>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(billContent);
      printWindow.document.close();
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentProduct.id?.startsWith('temp') ? 'New Product' : 'Edit Product'}
          </h2>
          <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input 
                type="text" 
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                value={currentProduct.name || ''}
                onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                value={currentProduct.category}
                onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value as ProductCategory })}
              >
                {Object.values(ProductCategory).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                value={currentProduct.price || 0}
                onChange={e => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input 
                type="number" 
                min="0" 
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                value={currentProduct.stock || 0}
                onChange={e => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <button 
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating || !currentProduct.name}
                className="text-xs text-accent hover:text-indigo-800 font-medium flex items-center disabled:opacity-50"
              >
                {isGenerating ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-magic mr-1"></i>}
                Auto-Generate with AI
              </button>
            </div>
            <textarea 
              rows={4}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
              value={currentProduct.description || ''}
              onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
              value={currentProduct.image || ''}
              onChange={e => setCurrentProduct({ ...currentProduct, image: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button type="submit" size="lg" isLoading={isSaving}>Save Product</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-500">Manage your products and orders.</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
           <div className="bg-gray-100 p-1 rounded-lg flex">
             <button 
               onClick={() => setActiveTab('products')}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Inventory
             </button>
             <button 
               onClick={() => setActiveTab('orders')}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Orders
             </button>
           </div>
           {activeTab === 'products' && (
             <Button onClick={handleNew}><i className="fas fa-plus mr-2"></i> Add Product</Button>
           )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {activeTab === 'products' ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img src={product.image} alt="" className="w-10 h-10 rounded object-cover mr-3 bg-gray-100" />
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{product.price.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900 p-2">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => onDelete(product.id)} className="text-red-500 hover:text-red-700 p-2">
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{order.id.toString().slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-xs text-gray-400">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <select 
                        value={order.status} 
                        onChange={(e) => onUpdateOrder(order.id, e.target.value as OrderStatus)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-none outline-none cursor-pointer ${
                          order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-800' :
                          order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-800' :
                          order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {Object.values(OrderStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handlePrintBill(order)}
                        className="text-gray-600 hover:text-primary p-2 flex items-center justify-end ml-auto"
                        title="Print Bill"
                      >
                        <i className="fas fa-print mr-2"></i> Print Bill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};