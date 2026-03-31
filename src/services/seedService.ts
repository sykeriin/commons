import { collection, doc, getDocs, setDoc, serverTimestamp, writeBatch, query, limit } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

const MOCK_CLUBS = [
  {
    name: "ROBOTICS SOCIETY",
    description: "Building the future, one gear at a time. Join us for weekly workshops and national competitions.",
    category: "TECH",
    logoURL: "https://picsum.photos/seed/robotics/200/200",
    ownerUid: "system",
  },
  {
    name: "CREATIVE WRITING GUILD",
    description: "A space for poets, novelists, and storytellers to share their work and grow together.",
    category: "ARTS",
    logoURL: "https://picsum.photos/seed/writing/200/200",
    ownerUid: "system",
  },
  {
    name: "VARSITY BASKETBALL",
    description: "The official campus basketball team. Tryouts every semester. Go Lions!",
    category: "SPORTS",
    logoURL: "https://picsum.photos/seed/basketball/200/200",
    ownerUid: "system",
  },
  {
    name: "UX DESIGN COLLECTIVE",
    description: "Exploring the intersection of design and technology. Portfolio reviews and industry talks.",
    category: "DESIGN",
    logoURL: "https://picsum.photos/seed/design/200/200",
    ownerUid: "system",
  },
  {
    name: "CHESS MASTERS",
    description: "Strategic thinking and friendly competition. All skill levels welcome.",
    category: "GAMES",
    logoURL: "https://picsum.photos/seed/chess/200/200",
    ownerUid: "system",
  }
];

const MOCK_EVENTS = [
  {
    name: "ANNUAL HACKATHON",
    description: "48 hours of coding, caffeine, and creativity. Win prizes and network with sponsors.",
    date: "2026-04-15",
    time: "09:00 AM",
    location: "Main Hall",
    category: "TECH",
  },
  {
    name: "POETRY SLAM NIGHT",
    description: "Express yourself through words. Open mic for all students.",
    date: "2026-04-10",
    time: "07:00 PM",
    location: "Student Lounge",
    category: "ARTS",
  },
  {
    name: "BASKETBALL FINALS",
    description: "The biggest game of the season. Come support our team!",
    date: "2026-04-20",
    time: "06:00 PM",
    location: "Campus Gym",
    category: "SPORTS",
  },
  {
    name: "DESIGN PORTFOLIO WORKSHOP",
    description: "Get feedback on your work from industry professionals.",
    date: "2026-04-05",
    time: "02:00 PM",
    location: "Design Studio B",
    category: "DESIGN",
  }
];

export const seedDatabase = async (userUid?: string) => {
  try {
    const clubsSnap = await getDocs(query(collection(db, 'clubs'), limit(1)));
    if (!clubsSnap.empty && !userUid) {
      console.log("Database already seeded.");
      return;
    }

    if (clubsSnap.empty) {
      console.log("Seeding database...");
      const batch = writeBatch(db);
      const clubIds: string[] = [];

      // Seed Clubs
      for (const club of MOCK_CLUBS) {
        const clubRef = doc(collection(db, 'clubs'));
        const clubId = clubRef.id;
        clubIds.push(clubId);
        
        batch.set(clubRef, {
          ...club,
          id: clubId,
          ownerUid: userUid || "system",
          memberCount: Math.floor(Math.random() * 50) + 10,
          createdAt: serverTimestamp(),
        });

        // Add the seeding user as the owner
        const memberRef = doc(db, `clubs/${clubId}/members`, userUid || "system");
        batch.set(memberRef, {
          clubId,
          userUid: userUid || "system",
          role: "owner"
        });
      }

      // Seed Events
      for (let i = 0; i < MOCK_EVENTS.length; i++) {
        const event = MOCK_EVENTS[i];
        const eventRef = doc(collection(db, 'events'));
        const clubId = clubIds[i % clubIds.length];
        
        batch.set(eventRef, {
          ...event,
          id: eventRef.id,
          clubId,
          attendeeCount: Math.floor(Math.random() * 100) + 20,
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();
      console.log("Seeding complete!");
    }

    // If userUid is provided, make them a member of the first 2 clubs if they aren't already
    if (userUid) {
      const clubsSnap = await getDocs(query(collection(db, 'clubs'), limit(2)));
      for (const clubDoc of clubsSnap.docs) {
        const clubId = clubDoc.id;
        const clubName = clubDoc.data().name;
        const memberRef = doc(db, `clubs/${clubId}/members`, userUid);
        const memberSnap = await getDocs(query(collection(db, `clubs/${clubId}/members`), limit(1))); // Simplified check
        // Just set it, it's fine if it overwrites
        await setDoc(memberRef, {
          clubId,
          userUid,
          clubName, // Denormalized for easier display
          role: 'member'
        }, { merge: true });
      }
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};
