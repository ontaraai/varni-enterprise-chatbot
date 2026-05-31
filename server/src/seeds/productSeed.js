const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Product = require('../models/product.model');

const realProducts = [
  {
    name: 'DT Label Roll 4x6 (100mm x 150mm)',
    category: 'Direct Thermal Labels',
    description:
      'Imported premium direct thermal label measuring 4" x 6" (100mm x 150mm). Top-coated for dark, clear print. Oilproof, scratchproof, and waterproof. Ideal for shipping labels, barcodes, and e-commerce packaging. Compatible with all thermal printers — no ink or toner required.',
    specifications: {
      size: '4" x 6" (100mm x 150mm)',
      labelsPerRoll: '400 labels',
      type: 'Direct Thermal (DT)',
      coating: 'Top-coated, oilproof, scratchproof, waterproof',
      printQuality: 'Dark and clear print',
      compatibility: 'All thermal printers',
      inkRequired: 'No (direct thermal technology)',
    },
    price: '₹175 + GST per roll',
    moq: 'Contact for bulk pricing',
    inStock: true,
    applications: [
      'E-commerce shipping labels',
      'Courier labels',
      'Barcode printing',
      'Warehouse labeling',
    ],
  },
  {
    name: 'DT Label Roll 4x4 (100mm x 100mm)',
    category: 'Direct Thermal Labels',
    description:
      'Premium 4" x 4" direct thermal label roll with 500 labels. Top-coated for superior print quality — oilproof, scratchproof, and waterproof. Works with all standard thermal printers without ink or toner.',
    specifications: {
      size: '4" x 4" (100mm x 100mm)',
      labelsPerRoll: '500 labels',
      type: 'Direct Thermal (DT)',
      coating: 'Top-coated, oilproof, scratchproof, waterproof',
      printQuality: 'Dark and clear print',
      compatibility: 'All thermal printers',
      inkRequired: 'No (direct thermal technology)',
    },
    price: '₹155 + GST per roll',
    moq: 'Contact for bulk pricing',
    inStock: true,
    applications: [
      'E-commerce packaging',
      'Shipping labels',
      'Product labeling',
      'Inventory management',
    ],
  },
  {
    name: 'DT Label Roll 3x5 (75mm x 125mm)',
    category: 'Direct Thermal Labels',
    description:
      'Compact 3" x 5" direct thermal label with 500 labels per roll. Features durable top-coated surface — oilproof, scratchproof, and waterproof. Ideal for shipping, inventory management, and barcode printing. No ink or toner needed.',
    specifications: {
      size: '3" x 5" (75mm x 125mm)',
      labelsPerRoll: '500 labels',
      type: 'Direct Thermal (DT)',
      coating: 'Top-coated, oilproof, scratchproof, waterproof',
      printQuality: 'Dark and clear print',
      compatibility: 'All thermal printers',
      inkRequired: 'No (direct thermal technology)',
    },
    price: '₹145 + GST per roll',
    moq: 'Contact for bulk pricing',
    inStock: true,
    applications: [
      'Shipping labels',
      'Courier business',
      'Inventory management',
      'Barcode printing',
    ],
  },
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert real products
    const inserted = await Product.insertMany(realProducts);
    console.log(`🌱 Seeded ${inserted.length} products successfully:`);
    inserted.forEach((p) => {
      console.log(`   📦 ${p.name} — ${p.price}`);
    });

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Done! Database seeded with real Varni Packaging products.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedProducts();
