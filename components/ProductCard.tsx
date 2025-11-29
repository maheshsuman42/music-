import React from 'react';
import { Product } from '../types';
import { Button } from './Button';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full border border-gray-100 group">
      <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => onViewDetails(product)}>
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-gray-800 backdrop-blur-sm">
          {product.category}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 
            className="text-lg font-bold text-gray-900 cursor-pointer hover:text-accent line-clamp-2"
            onClick={() => onViewDetails(product)}
          >
            {product.name}
          </h3>
        </div>
        
        <div className="flex items-center mb-2">
          <div className="flex text-secondary text-sm">
            {[...Array(5)].map((_, i) => (
              <i key={i} className={`fas fa-star ${i < Math.round(product.rating) ? '' : 'text-gray-300'}`}></i>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-2">({product.stock} in stock)</span>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <span className="text-xl font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => onAddToCart(product)}
            className="rounded-full !px-4"
          >
            <i className="fas fa-cart-plus mr-2"></i> Add
          </Button>
        </div>
      </div>
    </div>
  );
};