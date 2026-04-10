import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seedLeads() {
  const leads = [
    {
      businessName: "Joe's Pizza & Pasta",
      city: "New York",
      niche: "Italian Restaurant",
      address: "123 Broadway, NY",
      phone: "555-0123",
      email: "joe@joespizza.com",
      status: "qualified",
      createdAt: serverTimestamp(),
      uid: "test-user-id" // Replace with actual UID if needed, but for testing any string works if rules allow
    },
    {
      businessName: "Elite Plumbing Services",
      city: "Chicago",
      niche: "Plumbing",
      address: "456 Lake Shore Dr, IL",
      phone: "555-4567",
      email: "info@eliteplumbing.com",
      status: "qualified",
      createdAt: serverTimestamp(),
      uid: "test-user-id"
    },
    {
      businessName: "Vibrant Yoga Studio",
      city: "Austin",
      niche: "Yoga & Wellness",
      address: "789 Congress Ave, TX",
      phone: "555-7890",
      email: "hello@vibrantyoga.com",
      status: "qualified",
      createdAt: serverTimestamp(),
      uid: "test-user-id"
    }
  ];

  for (const lead of leads) {
    try {
      const docRef = await addDoc(collection(db, 'leads'), lead);
      console.log(`Added lead: ${lead.businessName} with ID: ${docRef.id}`);
    } catch (e) {
      console.error("Error adding lead: ", e);
    }
  }
}

seedLeads();
