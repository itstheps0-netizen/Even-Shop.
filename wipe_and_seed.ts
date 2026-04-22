import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const mixedComments = [
      "অসাধারণ সার্ভিস, অনেক দ্রুত পেলাম।",
      "Super fast delivery, highly recommended!",
      "বিশ্বাসযোগ্য সাইট, সবাই ট্রাই করতে পারেন।",
      "Best diamond top-up service I have ever used.",
      "সবচেয়ে কম দামে ডায়মন্ড পেলাম এখানে।",
      "Amazing panel, works perfectly without any ban.",
      "সাপোর্ট অনেক ভালো, কথা বলে খুব ভালো লাগলো।",
      "Customer support is top notch, they helped me instantly.",
      "২ মিনিটের মধ্যেই ডেলিভারি পেয়ে গেছি।",
      "Got my bot pack working perfectly, thanks!",
      "বেস্ট ফর ফ্রি ফায়ার প্লেয়ার্স।",
      "100% trusted site, I have bought diamonds 5 times now.",
      "অনেক নিরাপদ একটা শপ।",
      "The UI is so simple and the payment is very secure.",
      "প্যানেলটা একদম ঠিকঠাক কাজ করছে।",
      "Really cheap prices compared to others.",
      "বট প্যাক নিয়ে অনেক উপকার হলো।",
      "Finally a legit shop for BD gamers. Love it!",
      "১০০% বিশ্বস্ত, কোনো সন্দেহ নেই।",
      "Super fast process. Just placed the order and got it.",
      "আমি আগে অনেক জায়গায় ঠকেছি, কিন্তু এখানে সার্ভিস একদম জেনুইন।",
      "The lucky wheel is actually fun and I won diamonds!",
      "দারুণ সার্ভিস! খুব দ্রুত ডায়মন্ড পেয়েছি।",
      "Friendly admins and extremely fast delivery.",
      "প্রাইজ অনেক কম এবং ভরসাযোগ্য। ধন্যবাদ ইভেন শপ।",
      "Always reliable, my go-to shop for Free Fire.",
      "সাপোর্ট অনেক ভালো, আমার সব সমস্যার সমাধান করে দিয়েছে দ্রুত।",
      "Never had any issues with my ID. Completely safe.",
      "অবিশ্বাস্য সার্ভিস! ২ মিনিটের মধ্যে ডায়মন্ড পেয়েছি।",
      "Five stars! The VIP panel is incredible.",
      "এই সাইটটা সেরা। প্যানেল অনেক ভালো কাজ করে।",
      "I was scared at first, but this is completely legit.",
      "আমি ১০০% সন্তুষ্ট। ইভেন শপ থেকে কেনা সবসময় নিরাপদ।",
      "Great job with the fast top-ups.",
      "অসাধারণ কালেকশন। বট প্যাকগুলো অনেক শক্তিশালী।",
      "Best community and best service in BD.",
      "এত কম দামে কোথাও সার্ভিস পাওয়া যায় না। ধন্যবাদ!",
      "Can't believe how fast they are.",
      "খুবই ভালো সার্ভিস, ধন্যবাদ।",
      "Totally worth the price.",
      "বিশ্বাস রেখে ডায়মন্ড নিতে পারেন।",
      "Absolutely fantastic service, very cooperative admin.",
      "অনেক ফাস্ট ডেলিভারি পেলাম।",
      "I will recommend this shop to all my friends.",
      "ইভেন শপ সত্যি অসাধারণ।",
      "Smooth transaction via Bkash.",
      "প্রাইজ অনেক কম আর সার্ভিস ভালো।",
      "The UI color is beautiful and works great.",
      "সাপোর্ট টিমের কথা বলাটা সত্যিই সুন্দর।",
      "Never faced any delay.",
      "বেস্ট ফ্রি ফায়ার শপ ইন বাংলাদেশ।",
      "Awesome experience, will purchase again.",
      "বট প্যাকের জন্য সেরা ডিল।",
      "10/10 service for Bangladeshi gamers.",
      "১০০% ট্রাস্টেড সাইট।",
      "Got my top-up in 1 minute, unbelievable!",
      "অসাধারণ প্যানেল, গেমপ্লে অনেক উন্নত হয়েছে।",
      "Highly professional and trusted.",
      "একদম রিয়েল সার্ভিস, কোনো ফেইক কিছু নেই।",
      "Loving the VIP panel access.",
      "ডেলিভারি টাইম অনেক কম, জাস্ট ওয়াও।",
      "Best place to buy game credits securely."
];

const names = [
  "Maliha", "Zubayer", "Tanvir", "Siam", "Rifat", "Niloy", "Sanjida", "Farhana", "Iqbal", "Ashraful", 
  "Sakib", "Tamim", "Mushfiq", "Mahmudullah", "Mustafiz", "Taskin", "Shoriful", "Afif", "Nurul", "Mehidy", 
  "Mahedi", "Nasum", "Ebadot", "Khaled", "Rejaur", "Taijul", "Nayeem", "Shohidul", "Kamrul", "Enamul", 
  "Rony", "Sabbir", "Fazle", "Junaid", "Irfan", "Rubel", "Shafiul", "Abdur", "Rubina", "Sumaiya", 
  "Tasmia", "Anika", "Ishrat", "Jannat", "Nadia", "Mim", "Tithi", "Raisa", "Lamia", "Fariha", 
  "Sara", "Maisha", "Zarin", "Tasfia", "Nuzhat", "Arafat", "Shuvo", "Rakib", "Arif", "Hasan", "Imran"
];

async function wipeAndSeed() {
  console.log("Wiping existing reviews...");
  const snap = await getDocs(collection(db, 'reviews'));
  for (const doc of snap.docs) {
    await deleteDoc(doc.ref);
  }
  
  console.log("Seeding started...");
  for (let i = 0; i < mixedComments.length; i++) {
    const name = names[i] || `User${i}`;
    await addDoc(collection(db, 'reviews'), {
      userName: name,
      email: `${name.toLowerCase()}${i}@gmail.com`,
      rating: 5,
      comment: mixedComments[i],
      isFake: true,
      userId: 'fake-id-' + Math.random(),
      userPhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=150`,
      createdAt: serverTimestamp()
    });
    console.log(`Added: ${name}`);
  }
  console.log("Done");
  process.exit(0);
}

wipeAndSeed();
