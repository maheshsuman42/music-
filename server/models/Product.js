const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Guitar', 'Drums', 'Keyboards', 'Wind', 'Accessories']
  },
  image: { type: String, required: true },
  rating: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  reviews: [reviewSchema]
}, { timestamps: true });

// Transform _id to id for frontend compatibility
productSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

module.exports = mongoose.model('Product', productSchema);