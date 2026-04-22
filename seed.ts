import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const products = [
  // Topup
  { name: "Weekly Membership", description: "Get diamonds daily for 7 days.", price: 190, category: "topup", active: true, stock: 999 },
  { name: "Weekly Lite", description: "Budget weekly pack.", price: 90, category: "topup", active: true, stock: 999 },
  { name: "Monthly Membership", description: "30 days of diamonds and rewards.", price: 790, category: "topup", active: true, stock: 999 },
  { name: "Monthly Lite", description: "Budget monthly pack.", price: 350, category: "topup", active: true, stock: 999 },
  
  // Panels
  { name: "Master VIP Anti-Ban Panel", description: "The ultimate undetectable precision tool.", price: 2500, category: "panels", active: true, stock: 50 },
  { name: "VIP Panel", description: "Premium features for elite players.", price: 1500, category: "panels", active: true, stock: 100 },
  { name: "Anti-Ban Panel", description: "Focus on account safety and stealth.", price: 1200, category: "panels", active: true, stock: 100 },
  { name: "Normal Panel", description: "Basic assistance for casual play.", price: 500, category: "panels", active: true, stock: 200 },
  { name: "Aim Bot Panel", description: "Maximum precision assistance.", price: 1800, category: "panels", active: true, stock: 50 },
  { name: "Location Panel", description: "Strategic enemy tracking.", price: 1000, category: "panels", active: true, stock: 100 },

  // Bots
  { name: "Guild Glory Bot", description: "Automated guild glory farming (Monthly).", price: 500, category: "bots", active: true, stock: 999 },
  { name: "Guild Bot", description: "Manage your guild automatically (Monthly).", price: 450, category: "bots", active: true, stock: 999 },
  { name: "ID Bot", description: "Advanced ID tracking and management (Monthly).", price: 600, category: "bots", active: true, stock: 999 },
  { name: "Custom Bot", description: "Tailored bot for your specific needs (Monthly).", price: 300, category: "bots", active: true, stock: 999 }
];

async function seed() {
  console.log("Cleaning and Seeding products...");
  const productsCol = collection(db, 'products');
  
  const existing = await getDocs(productsCol);
  for (const d of existing.docs) {
    await deleteDoc(doc(db, 'products', d.id));
  }

  for (const product of products) {
    await addDoc(productsCol, product);
    console.log(`Added: ${product.name} (${product.price} TK)`);
  }
  console.log("Seeding complete!");
}

seed().catch(console.error);
