import type { DB, Person, Course, Section, Enrollment, Assignment, Submission, AttendanceRecord, Club, ClubMembership, CampusEvent, Rsvp, Announcement, OfficeHour, Place } from '../types';
import { addDays, iso } from '@/src/lib/dates';

// Small deterministic PRNG so demo data is stable between reloads.
function rng(seed: number) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }

const DEPTS = [
  { id: 'cs', name: 'Computer Science', code: 'CS', color: '#004be2', building: 'Turing Hall', description: 'Algorithms, systems, AI and the software that runs the world.' },
  { id: 'eng', name: 'Engineering', code: 'ENG', color: '#455a64', building: 'Forge Building', description: 'Mechanical, electrical and civil engineering with a build-first culture.' },
  { id: 'bio', name: 'Life Sciences', code: 'BIO', color: '#4e6300', building: 'Helix Labs', description: 'Biology, biochemistry and environmental science.' },
  { id: 'arts', name: 'Arts & Design', code: 'ART', color: '#c2185b', building: 'Atelier', description: 'Visual design, media, music and performance.' },
  { id: 'bus', name: 'Business', code: 'BUS', color: '#6a4fd8', building: 'Meridian Centre', description: 'Management, economics and entrepreneurship.' },
  { id: 'hum', name: 'Humanities', code: 'HUM', color: '#00838f', building: 'Quill House', description: 'Literature, history, philosophy and languages.' },
];

const PLACES: Place[] = [
  ['turing-101', 'Room 101', 'Turing Hall', 'lecture', 120], ['turing-lab', 'Systems Lab', 'Turing Hall', 'lab', 40],
  ['forge-a', 'Workshop A', 'Forge Building', 'lab', 30], ['forge-210', 'Room 210', 'Forge Building', 'lecture', 80],
  ['helix-lab', 'Wet Lab 2', 'Helix Labs', 'lab', 24], ['helix-150', 'Room 150', 'Helix Labs', 'lecture', 90],
  ['atelier-studio', 'Studio 3', 'Atelier', 'lab', 28], ['atelier-hall', 'Black Box Theatre', 'Atelier', 'hall', 200],
  ['meridian-2', 'Seminar 2', 'Meridian Centre', 'lecture', 60], ['quill-12', 'Room 12', 'Quill House', 'lecture', 50],
  ['library', 'Main Library', 'Central Library', 'library', 400], ['quad', 'The Quad', 'Campus Green', 'outdoor', 2000],
  ['gym', 'Sports Arena', 'Athletics Centre', 'sports', 1200], ['union', 'Student Union Hall', 'Student Union', 'hall', 500],
].map(([id, name, building, kind, capacity]) => ({ id, name, building, kind, capacity }) as Place);

const FACULTY: [string, string, string, string][] = [
  // id, name, title, dept
  ['f-ada', 'Dr. Ada Okonkwo', 'Professor', 'cs'], ['f-ravi', 'Dr. Ravi Menon', 'Associate Professor', 'cs'],
  ['f-lena', 'Dr. Lena Hartmann', 'Professor', 'eng'], ['f-tomas', 'Dr. Tomás Ibarra', 'Assistant Professor', 'eng'],
  ['f-priya', 'Dr. Priya Nair', 'Professor', 'bio'], ['f-kwame', 'Dr. Kwame Asante', 'Lecturer', 'bio'],
  ['f-sofia', 'Prof. Sofia Marchetti', 'Professor', 'arts'], ['f-jin', 'Prof. Jin Park', 'Senior Lecturer', 'arts'],
  ['f-omar', 'Dr. Omar Haddad', 'Professor', 'bus'], ['f-claire', 'Dr. Claire Dubois', 'Associate Professor', 'bus'],
  ['f-eli', 'Dr. Eli Rosenthal', 'Professor', 'hum'], ['f-mei', 'Dr. Mei Lin', 'Assistant Professor', 'hum'],
];
const HEADS: Record<string, string> = { cs: 'f-ada', eng: 'f-lena', bio: 'f-priya', arts: 'f-sofia', bus: 'f-omar', hum: 'f-eli' };

const COURSES: [string, string, string, string, number][] = [
  ['cs', 'CS101', 'Intro to Programming', 'f-ravi', 3], ['cs', 'CS220', 'Data Structures', 'f-ada', 4], ['cs', 'CS340', 'Operating Systems', 'f-ravi', 4], ['cs', 'CS410', 'Machine Learning', 'f-ada', 3],
  ['eng', 'ENG110', 'Engineering Mechanics', 'f-tomas', 4], ['eng', 'ENG230', 'Circuits & Signals', 'f-lena', 4], ['eng', 'ENG320', 'Thermodynamics', 'f-tomas', 3],
  ['bio', 'BIO101', 'Cell Biology', 'f-kwame', 4], ['bio', 'BIO240', 'Genetics', 'f-priya', 3], ['bio', 'BIO330', 'Ecology', 'f-kwame', 3],
  ['arts', 'ART105', 'Design Foundations', 'f-jin', 3], ['arts', 'ART220', 'Interaction Design', 'f-sofia', 3], ['arts', 'ART310', 'Motion & Media', 'f-jin', 3],
  ['bus', 'BUS101', 'Principles of Management', 'f-claire', 3], ['bus', 'BUS210', 'Microeconomics', 'f-omar', 3], ['bus', 'BUS340', 'Entrepreneurship', 'f-claire', 3],
  ['hum', 'HUM101', 'Critical Writing', 'f-mei', 3], ['hum', 'HUM215', 'Ethics & Technology', 'f-eli', 3], ['hum', 'HUM260', 'World History since 1800', 'f-mei', 3],
];
const ROOMS: Record<string, string[]> = {
  cs: ['turing-101', 'turing-lab'], eng: ['forge-210', 'forge-a'], bio: ['helix-150', 'helix-lab'],
  arts: ['atelier-studio'], bus: ['meridian-2'], hum: ['quill-12'],
};
const TIMES: [string, string][] = [['09:00', '10:15'], ['10:30', '11:45'], ['13:00', '14:15'], ['14:30', '15:45']];
const PATTERNS: [number, number][] = [[1, 3], [2, 4], [1, 4], [2, 5]];

const FIRST = ['Aarav', 'Maya', 'Noah', 'Zara', 'Liam', 'Sana', 'Ethan', 'Isla', 'Kai', 'Nia', 'Mateo', 'Ines', 'Arjun', 'Leila', 'Owen', 'Yuki', 'Diego', 'Amara', 'Finn', 'Rhea', 'Jonas', 'Tara', 'Luca', 'Hana', 'Idris', 'Mila', 'Ravi', 'Esme', 'Theo', 'Anika', 'Sami', 'Chloe', 'Dev', 'Freya', 'Omar', 'Lucia', 'Jules', 'Priya', 'Cole', 'Noor'];
const LAST = ['Sharma', 'Chen', 'Okafor', 'Silva', 'Novak', 'Haddad', 'Kim', 'Rossi', 'Patel', 'Müller', 'Tanaka', 'Garcia', 'Khan', 'Nguyen', 'Cohen', 'Adeyemi', 'Larsen', 'Reyes', 'Singh', 'Moreau'];

export function buildSeed(): DB {
  const r = rng(42);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const now = new Date();
  const D = (n: number) => iso(addDays(now, n));
  const stamp = (n: number) => addDays(now, n).toISOString();

  const people: Person[] = [];
  FACULTY.forEach(([id, name, title, departmentId], i) => people.push({
    id, name, title, departmentId, email: `${id.slice(2)}@commons.edu`, role: HEADS[departmentId] === id ? 'dept_head' : 'faculty',
    office: `${DEPTS.find(d => d.id === departmentId)!.building} ${200 + i}`, karma: 100 + i * 7,
    bio: `${title} in ${DEPTS.find(d => d.id === departmentId)!.name}.`,
  }));
  people.push({ id: 'staff-jo', name: 'Jo Whitfield', title: 'Student Affairs Officer', email: 'jo@commons.edu', role: 'staff', karma: 40, office: 'Student Union 14' });
  people.push({ id: 'admin-sam', name: 'Sam Rivera', title: 'Campus Administrator', email: 'sam@commons.edu', role: 'admin', karma: 10, office: 'Admin Block 1' });
  const students: Person[] = [];
  for (let i = 0; i < 42; i++) {
    const dept = DEPTS[i % DEPTS.length];
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7 + 3) % LAST.length]}`;
    students.push({ id: `s-${i}`, name, email: `${name.split(' ')[0].toLowerCase()}.${i}@commons.edu`, role: 'student', departmentId: dept.id, year: (i % 4) + 1, programId: `${dept.id}-bsc`, karma: Math.floor(r() * 400), bio: '' });
  }
  students[0] = { ...students[0], id: 's-demo', name: 'Alex Morgan', email: 'alex@commons.edu', departmentId: 'cs', programId: 'cs-bsc', year: 3, karma: 240, bio: 'CS junior. Robotics, late-night coding, bad puns.' };
  people.push(...students);

  const programs = DEPTS.flatMap(d => [
    { id: `${d.id}-bsc`, departmentId: d.id, name: `BSc ${d.name}`, degree: 'BSc' as const, credits: 120 },
    { id: `${d.id}-msc`, departmentId: d.id, name: `MSc ${d.name}`, degree: 'MSc' as const, credits: 60 },
  ]);

  const courses: Course[] = COURSES.map(([departmentId, code, title, , credits]) => ({
    id: code.toLowerCase(), code, title, departmentId, credits,
    description: `${title}: lectures, hands-on practice and a term project. Part of the ${DEPTS.find(d => d.id === departmentId)!.name} curriculum.`,
  }));
  const sections: Section[] = COURSES.map(([departmentId, code, , instructorId], i) => {
    const [d1, d2] = PATTERNS[i % PATTERNS.length]; const [start, end] = TIMES[i % TIMES.length];
    const rooms = ROOMS[departmentId];
    return { id: `sec-${code.toLowerCase()}`, courseId: code.toLowerCase(), term: 'Fall 2026', instructorId, capacity: 30 + (i % 3) * 10,
      slots: [d1, d2].map(day => ({ day: day as 1, start, end, placeId: rooms[i % rooms.length] })) };
  });

  const enrollments: Enrollment[] = []; const attendance: AttendanceRecord[] = [];
  const assignments: Assignment[] = []; const submissions: Submission[] = [];
  sections.forEach((s, si) => {
    ['Problem set 1', 'Midterm project', 'Problem set 2', 'Lab report'].forEach((t, ai) => assignments.push({
      id: `as-${s.id}-${ai}`, sectionId: s.id, title: t, points: ai === 1 ? 100 : 50,
      description: `Complete the ${t.toLowerCase()} for ${s.courseId.toUpperCase()}. Submit via the course page.`, dueAt: D(ai * 6 - 8 + (si % 5)),
    }));
  });
  const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+'];
  people.filter(p => p.role === 'student').forEach((st, i) => {
    const mine = sections.filter(s => st.id === 's-demo' ? ['cs220', 'cs340', 'cs410', 'hum215', 'art220'].includes(s.courseId)
      : courses.find(c => c.id === s.courseId)!.departmentId === st.departmentId || (i + sections.indexOf(s)) % 7 === 0).slice(0, 5);
    mine.forEach(s => {
      enrollments.push({ id: `en-${st.id}-${s.id}`, sectionId: s.id, studentId: st.id, status: 'enrolled', grade: pick(GRADES) });
      assignments.filter(a => a.sectionId === s.id).forEach(a => {
        if (new Date(a.dueAt) < now) submissions.push({ id: `su-${a.id}-${st.id}`, assignmentId: a.id, studentId: st.id, submittedAt: a.dueAt, score: Math.round(a.points * (0.62 + r() * 0.36)) });
      });
      for (let w = 1; w <= 6; w++) s.slots.forEach(sl => {
        const date = addDays(now, -w * 7 + (sl.day - now.getDay()));
        if (date < now) attendance.push({ id: `at-${st.id}-${s.id}-${iso(date)}`, sectionId: s.id, date: iso(date), studentId: st.id, status: (st.id === 's-demo' && s.id === 'sec-cs340' && w % 2 === 0) ? 'absent' : r() < 0.86 ? 'present' : r() < 0.5 ? 'late' : r() < 0.7 ? 'excused' : 'absent' });
      });
    });
  });

  const CLUBS: [string, string, string, string, string, string?][] = [
    ['robotics', 'Robotics Society', 'Tech', 'Build bots, enter national competitions, break things responsibly.', '#004be2', 'f-lena'],
    ['writers', 'Creative Writing Guild', 'Arts', 'Poets, novelists and storytellers sharing work every week.', '#c2185b', 'f-mei'],
    ['hoops', 'Varsity Basketball', 'Sports', 'Official campus team. Tryouts every semester.', '#9d2f6b'],
    ['ux', 'UX Design Collective', 'Design', 'Portfolio reviews, industry talks and design sprints.', '#6a4fd8', 'f-sofia'],
    ['chess', 'Chess Masters', 'Games', 'Strategic thinking and friendly competition, all levels.', '#4e6300'],
    ['ml', 'AI & ML Circle', 'Tech', 'Reading groups and weekend model-building.', '#004be2', 'f-ada'],
    ['green', 'Green Campus', 'Service', 'Sustainability projects, clean-ups and the community garden.', '#00838f', 'f-priya'],
    ['debate', 'Debate Union', 'Academic', 'Parliamentary debate, public speaking and inter-college tournaments.', '#6a4fd8', 'f-eli'],
    ['startup', 'Startup Garage', 'Business', 'Pitch nights, founder talks and a small seed fund.', '#9d2f6b', 'f-claire'],
    ['film', 'Film Society', 'Arts', 'Weekly screenings and a yearly short-film festival.', '#c2185b', 'f-jin'],
    ['dance', 'Rhythm Dance Crew', 'Arts', 'Street, contemporary and cultural dance.', '#c2185b'],
    ['biolab', 'Biotech Lab Club', 'Science', 'Journal clubs and open-lab nights.', '#4e6300', 'f-kwame'],
  ];
  const clubs: Club[] = []; const memberships: ClubMembership[] = [];
  CLUBS.forEach(([id, name, category, description, color, advisorId], i) => {
    const presidentId = students[(i * 3 + 1) % students.length].id === 's-demo' ? 's-5' : students[(i * 3 + 1) % students.length].id;
    clubs.push({ id, name, category, description, color, presidentId, advisorId, joinPolicy: ['robotics', 'hoops', 'debate'].includes(id) ? 'request' : 'open', approval: 'approved', memberCount: 0, createdAt: stamp(-200 + i) });
    memberships.push({ id: `m-${id}-p`, clubId: id, personId: presidentId, role: 'president', joinedAt: stamp(-200) });
    if (advisorId) memberships.push({ id: `m-${id}-a`, clubId: id, personId: advisorId, role: 'advisor', joinedAt: stamp(-200) });
    for (let k = 0; k < 6 + (i % 5); k++) {
      const st = students[(i * 5 + k * 3) % students.length];
      if (!memberships.some(m => m.clubId === id && m.personId === st.id)) memberships.push({ id: `m-${id}-${st.id}`, clubId: id, personId: st.id, role: k === 0 ? 'officer' : 'member', joinedAt: stamp(-120 + k) });
    }
  });
  ['robotics', 'ml', 'chess'].forEach((c, i) => { if (!memberships.some(m => m.clubId === c && m.personId === 's-demo')) memberships.push({ id: `m-${c}-demo`, clubId: c, personId: 's-demo', role: i === 0 ? 'officer' : 'member', joinedAt: stamp(-90) }); });
  clubs.push({ id: 'quidditch', name: 'Quidditch Society', category: 'Sports', description: 'Yes, with the brooms. Seeking approval to register.', color: '#6a4fd8', presidentId: 's-7', approval: 'pending', memberCount: 1, createdAt: stamp(-2) });
  memberships.push({ id: 'm-quid-p', clubId: 'quidditch', personId: 's-7', role: 'president', joinedAt: stamp(-2) });
  clubs.forEach(c => { c.memberCount = memberships.filter(m => m.clubId === c.id).length; });

  const EV: [string, string, string, number, string, string, string, string, 'campus' | 'club' | 'department', string?, number?][] = [
    ['Robotics Open Day', 'Tech', 'See this year\'s bots, meet the team and try the driving arena.', 0, '15:00', '17:00', 'forge-a', 'robotics', 'club', 'robotics', 60],
    ['Freshers\' Welcome Mixer', 'Social', 'Meet people, grab food, find your club.', 1, '18:00', '21:00', 'union', 'staff-jo', 'campus', undefined, 400],
    ['Intro to Machine Learning Workshop', 'Tech', 'Hands-on notebook session. Bring a laptop.', 2, '16:00', '18:00', 'turing-lab', 'ml', 'club', 'ml', 35],
    ['Poetry Slam Night', 'Arts', 'Open mic for all students. Sign-up on the night.', 3, '19:00', '21:30', 'atelier-hall', 'writers', 'club', 'writers', 150],
    ['Career Fair 2026', 'Career', '80+ employers, CV clinics and on-the-spot interviews.', 5, '10:00', '16:00', 'union', 'staff-jo', 'campus', undefined, 500],
    ['Basketball: Lions vs Hawks', 'Sports', 'Home game. Wear your colours!', 4, '19:30', '21:30', 'gym', 'hoops', 'club', 'hoops', 1000],
    ['Startup Pitch Night', 'Business', 'Five teams, five minutes each, one winner.', 6, '18:00', '20:00', 'meridian-2', 'startup', 'club', 'startup', 55],
    ['Annual Hackathon', 'Tech', '48 hours of code, caffeine and creativity.', 11, '09:00', '18:00', 'turing-101', 'f-ada', 'department', undefined, 100],
    ['Campus Clean-up Day', 'Service', 'Gloves provided. Lunch is on us.', 8, '10:00', '13:00', 'quad', 'green', 'club', 'green', 200],
    ['Open Lecture: Ethics of AI', 'Academic', 'Dr. Eli Rosenthal in conversation with the AI & ML Circle.', 7, '17:00', '18:30', 'quill-12', 'f-eli', 'department', undefined, 50],
    ['Chess Simul vs. the Champion', 'Games', 'Play the regional champion on 20 boards at once.', 9, '18:00', '20:00', 'library', 'chess', 'club', 'chess', 20],
    ['Film Night: Short Cuts', 'Arts', 'Student shorts followed by Q&A.', 10, '19:00', '21:00', 'atelier-hall', 'film', 'club', 'film', 150],
    ['Winter Formal (draft)', 'Social', 'Proposed campus-wide formal. Awaiting approval.', 25, '19:00', '23:00', 'union', 's-3', 'campus', undefined, 400],
    ['Yesterday\'s Seminar', 'Academic', 'Past event for history.', -1, '14:00', '15:00', 'meridian-2', 'f-omar', 'department', undefined, 40],
  ];
  const events: CampusEvent[] = EV.map(([title, category, description, off, start, end, placeId, org, scope, clubId, capacity], i) => ({
    id: `ev-${i}`, title, category, description, date: D(off), start, end, placeId, scope, clubId, capacity, organizerId: clubId ? (clubs.find(c => c.id === clubId)?.presidentId ?? org) : org,
    departmentId: scope === 'department' ? people.find(p => p.id === org)?.departmentId : undefined,
    approval: title.includes('(draft)') ? 'pending' : 'approved', createdAt: stamp(-10),
  }));
  const rsvps: Rsvp[] = [];
  events.filter(e => e.approval === 'approved').forEach((e, i) => {
    const n = Math.min(e.capacity ?? 10, 4 + (i * 3) % 11);
    for (let k = 0; k < n; k++) rsvps.push({ id: `rs-${e.id}-${k}`, eventId: e.id, personId: students[(i + k * 2) % students.length].id, status: 'going', checkedIn: e.date < D(0), createdAt: stamp(-3) });
  });
  const chess = events.find(e => e.title.startsWith('Chess'))!; // fill to capacity to exercise the waitlist
  students.slice(0, 20).forEach((s, k) => { if (s.id !== 's-demo' && !rsvps.some(x => x.eventId === chess.id && x.personId === s.id)) rsvps.push({ id: `rs-chess-${k}`, eventId: chess.id, personId: s.id, status: 'going', checkedIn: false, createdAt: stamp(-2) }); });

  const announcements: Announcement[] = [
    { id: 'an-1', title: 'Fall registration deadline extended', body: 'Add/drop for Fall 2026 is open until Friday 5 PM. Speak to your advisor if you need a seat override.', authorId: 'admin-sam', createdAt: stamp(0), pinned: true, scope: 'campus' },
    { id: 'an-2', title: 'Library extended hours during midterms', body: 'The Main Library is open until 2 AM Sunday to Thursday for the next three weeks.', authorId: 'staff-jo', createdAt: stamp(-1), scope: 'campus' },
    { id: 'an-3', title: 'Shuttle schedule change', body: 'The north-gate shuttle now runs every 10 minutes between 8 AM and 6 PM.', authorId: 'staff-jo', createdAt: stamp(-3), scope: 'campus' },
    { id: 'an-4', title: 'CS Dept: capstone proposals due', body: 'All final-year CS students must submit capstone proposals by the 20th.', authorId: 'f-ada', createdAt: stamp(-1), scope: 'department', scopeId: 'cs', pinned: true },
    { id: 'an-5', title: 'Midterm covers chapters 1–6', body: 'Bring a calculator and a single-sided cheat sheet. Room is unchanged.', authorId: 'f-ada', createdAt: stamp(-2), scope: 'course', scopeId: 'sec-cs220' },
    { id: 'an-6', title: 'Lab 3 moved to Thursday', body: 'The OS lab is moved to Thursday because of the systems-lab maintenance.', authorId: 'f-ravi', createdAt: stamp(-4), scope: 'course', scopeId: 'sec-cs340' },
    { id: 'an-7', title: 'Robotics: competition travel forms', body: 'Everyone travelling to nationals needs a signed consent form by Friday.', authorId: 'f-lena', createdAt: stamp(-1), scope: 'club', scopeId: 'robotics' },
  ];

  const officeHours: OfficeHour[] = FACULTY.flatMap(([id, , , dept], i) => [
    { id: `oh-${id}-1`, facultyId: id, day: 2, start: '15:30', end: '17:00', placeId: ROOMS[dept][0], booked: [] },
    { id: `oh-${id}-2`, facultyId: id, day: 4, start: '11:00', end: '12:30', placeId: ROOMS[dept][0], booked: i % 3 === 0 ? ['s-3'] : [] },
  ]);

  return {
    people, departments: DEPTS.map(d => ({ ...d, headId: HEADS[d.id] })), programs, courses, sections, enrollments, assignments, submissions, attendance,
    clubs, memberships, joinRequests: [{ id: 'jr-1', clubId: 'robotics', personId: 's-9', status: 'pending', message: 'I built a line-follower last year!' }],
    events, rsvps, announcements, officeHours,
    roleRequests: [{ id: 'rr-1', personId: 's-11', requested: 'staff', reason: 'I have been hired as the new events coordinator.', status: 'pending', createdAt: stamp(-1) }],
    notices: [
      { id: 'nt-1', personId: 's-demo', title: 'Assignment due soon', body: 'Problem set 2 in Data Structures is due in 2 days.', createdAt: stamp(0), read: false, link: '/academics' },
      { id: 'nt-2', personId: 's-demo', title: 'Robotics: new join request', body: 'A student asked to join Robotics Society.', createdAt: stamp(-1), read: false, link: '/clubs/robotics' },
      { id: 'nt-3', personId: 's-demo', title: 'Welcome to Commons', body: 'Your campus, in one place.', createdAt: stamp(-5), read: true },
    ],
    audit: [], places: PLACES,
  };
}

export const PERSONAS: { id: string; label: string; blurb: string }[] = [
  { id: 's-demo', label: 'Alex Morgan', blurb: 'CS student, robotics officer' },
  { id: 'f-ada', label: 'Dr. Ada Okonkwo', blurb: 'Professor & CS dept head' },
  { id: 'f-ravi', label: 'Dr. Ravi Menon', blurb: 'Associate professor' },
  { id: 'staff-jo', label: 'Jo Whitfield', blurb: 'Student affairs staff' },
  { id: 'admin-sam', label: 'Sam Rivera', blurb: 'Campus administrator' },
];
