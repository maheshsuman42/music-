import { Product, ProductCategory, User, UserRole } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Fender Stratocaster Player Series',
    description: 'The inspiring sound of a Stratocaster is one of the foundations of Fender. Featuring this classic sound—bell-like high end, punchy mids and robust low end, combined with crystal-clear articulation—the Player Stratocaster is packed with authentic Fender feel and style.',
    price: 65000,
    category: ProductCategory.GUITAR,
    image: 'https://images.unsplash.com/photo-1550291652-6ea9114a47b1?auto=format&fit=crop&q=80&w=500',
    rating: 4.8,
    stock: 12,
    reviews: [
      {
        id: 'r1',
        userId: 'u2',
        userName: 'Alice Cooper',
        rating: 5,
        comment: 'Absolutely love the tone! The neck feels amazing.',
        date: '2023-10-15T10:00:00Z'
      },
      {
        id: 'r2',
        userId: 'u3',
        userName: 'Bob Dylan',
        rating: 4,
        comment: 'Great guitar but needs a setup out of the box.',
        date: '2023-11-02T14:30:00Z'
      }
    ]
  },
  {
    id: '2',
    name: 'Gibson Les Paul Standard',
    description: 'The new Les Paul Standard returns to the classic design that made it relevant, played, and loved -- shaping sound across generations and genres of music. It pays tribute to Gibson\'s Golden Era of innovation and brings authenticity back to life.',
    price: 185000,
    category: ProductCategory.GUITAR,
    image: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&q=80&w=500',
    rating: 5.0,
    stock: 5,
    reviews: []
  },
  {
    id: '3',
    name: 'Yamaha P-125 Digital Piano',
    description: 'The Yamaha P-125 is a compact digital piano that combines incredible piano performance with a user-friendly minimalist design. Easily portable and extremely accessible, this instrument allows you to experience the joy of playing the piano on your terms.',
    price: 52000,
    category: ProductCategory.KEYS,
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=500',
    rating: 4.6,
    stock: 20,
    reviews: []
  },
  {
    id: '4',
    name: 'Pearl Export EXX Drum Set',
    description: 'Pearl Export Series drums are the best selling drum set of all time. Designed to give the beginning drummer a high-end look and sound at an affordable price, Export is the perfect kit to start your drumming journey.',
    price: 62000,
    category: ProductCategory.DRUMS,
    image: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&q=80&w=500',
    rating: 4.7,
    stock: 8,
    reviews: []
  },
  {
    id: '5',
    name: 'Roland TD-17KVX V-Drums',
    description: 'The TD-17KVX lets your technique shine through, backed up with training tools to push you further. Combining a TD-50-class sound engine with newly developed pads results in an affordable electronic drum kit that’s authentically close to playing acoustic drums.',
    price: 120000,
    category: ProductCategory.DRUMS,
    image: 'https://images.unsplash.com/photo-1595168051636-2396e95c4794?auto=format&fit=crop&q=80&w=500',
    rating: 4.9,
    stock: 3,
    reviews: []
  },
  {
    id: '6',
    name: 'Korg Minilogue XD',
    description: 'Next-generation polyphonic analog synthesizer. The Minilogue XD brings the analog synth sound to a whole new generation of musicians with a focus on real-time control and deep sound design capabilities.',
    price: 48000,
    category: ProductCategory.KEYS,
    image: 'https://images.unsplash.com/photo-1621550697928-8636e2f11270?auto=format&fit=crop&q=80&w=500',
    rating: 4.8,
    stock: 15,
    reviews: []
  },
];

export const MOCK_ADMIN: User = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@melodymart.com',
  role: UserRole.ADMIN,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
};

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  role: UserRole.USER,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
};