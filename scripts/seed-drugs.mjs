// Run once after setting up your Firebase project:
//   node scripts/seed-drugs.mjs
//
// Needs a service account key. In the Firebase console:
// Project settings -> Service accounts -> Generate new private key.
// Save it as serviceAccountKey.json in the project root (it's already
// gitignored - never commit this file).

import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
  readFileSync(new URL("../serviceAccountKey.json", import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const seedDrugs = [
  { id: "seed-panadol", brandName: "Panadol", genericName: "Paracetamol", commonDosage: "500mg", commonFrequency: "TDS" },
  { id: "seed-brufen", brandName: "Brufen", genericName: "Ibuprofen", commonDosage: "400mg", commonFrequency: "BD" },
  { id: "seed-augmentin", brandName: "Augmentin", genericName: "Amoxicillin/Clavulanate", commonDosage: "625mg", commonFrequency: "BD" },
  { id: "seed-amoxil", brandName: "Amoxil", genericName: "Amoxicillin", commonDosage: "500mg", commonFrequency: "TDS" },
  { id: "seed-flagyl", brandName: "Flagyl", genericName: "Metronidazole", commonDosage: "400mg", commonFrequency: "TDS" },
  { id: "seed-risek", brandName: "Risek", genericName: "Omeprazole", commonDosage: "20mg", commonFrequency: "OD" },
  { id: "seed-disprin", brandName: "Disprin", genericName: "Aspirin", commonDosage: "300mg", commonFrequency: "OD" },
  { id: "seed-calpol", brandName: "Calpol", genericName: "Paracetamol (Syrup)", commonDosage: "5ml", commonFrequency: "TDS" },
  { id: "seed-avil", brandName: "Avil", genericName: "Pheniramine", commonDosage: "25mg", commonFrequency: "BD" },
  { id: "seed-zinnat", brandName: "Zinnat", genericName: "Cefuroxime", commonDosage: "500mg", commonFrequency: "BD" },
  { id: "seed-buscopan", brandName: "Buscopan", genericName: "Hyoscine", commonDosage: "10mg", commonFrequency: "TDS" },
  { id: "seed-maxolon", brandName: "Maxolon", genericName: "Metoclopramide", commonDosage: "10mg", commonFrequency: "TDS" },
  { id: "seed-cital", brandName: "Cital", genericName: "Sodium Citrate", commonDosage: "10ml", commonFrequency: "BD" },
  { id: "seed-surbexz", brandName: "Surbex Z", genericName: "Multivitamin", commonDosage: "1 tab", commonFrequency: "OD" },
  { id: "seed-ponstan", brandName: "Ponstan", genericName: "Mefenamic Acid", commonDosage: "500mg", commonFrequency: "TDS" },
];

for (const drug of seedDrugs) {
  await db.collection("drugs").doc(drug.id).set(drug);
  console.log("Seeded", drug.brandName);
}

console.log(`Done. Seeded ${seedDrugs.length} drugs.`);
process.exit(0);
