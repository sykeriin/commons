import type { DB, Role, Approval, ClubRole, CampusEvent, Person, Club, Course, Department, Section, AttendanceRecord } from './types';

/** Everything the UI can do to the data. Demo and Firebase back-ends both implement this. */
export interface Actions {
  // academics
  enroll(sectionId: string, studentId: string): Promise<'enrolled' | 'waitlisted'>;
  drop(sectionId: string, studentId: string): Promise<void>;
  saveAttendance(sectionId: string, date: string, entries: { studentId: string; status: AttendanceRecord['status'] }[]): Promise<void>;
  setGrade(enrollmentId: string, grade: string): Promise<void>;
  setScore(assignmentId: string, studentId: string, score: number): Promise<void>;
  submitAssignment(assignmentId: string, studentId: string): Promise<void>;
  createAssignment(a: { sectionId: string; title: string; description: string; dueAt: string; points: number }): Promise<void>;
  createCourse(c: Omit<Course, 'id'> & { section?: Omit<Section, 'id' | 'courseId' | 'term'> }): Promise<void>;
  // departments / people
  saveDepartment(d: Partial<Department> & { name: string; code: string }): Promise<void>;
  setPersonRole(personId: string, role: Role): Promise<void>;
  setPersonDepartment(personId: string, departmentId: string): Promise<void>;
  updateProfile(personId: string, patch: Partial<Pick<Person, 'name' | 'bio' | 'departmentId' | 'year' | 'office'>>): Promise<void>;
  requestRole(personId: string, requested: Role, reason: string): Promise<void>;
  decideRole(requestId: string, decision: Exclude<Approval, 'pending'>): Promise<void>;
  // clubs
  createClub(c: Pick<Club, 'name' | 'description' | 'category' | 'color' | 'joinPolicy'> & { advisorId?: string }): Promise<string>;
  decideClub(clubId: string, decision: Exclude<Approval, 'pending'>): Promise<void>;
  joinClub(clubId: string): Promise<void>;
  leaveClub(clubId: string): Promise<void>;
  requestJoin(clubId: string, message: string): Promise<void>;
  decideJoin(requestId: string, decision: Exclude<Approval, 'pending'>): Promise<void>;
  setMemberRole(membershipId: string, role: ClubRole): Promise<void>;
  removeMember(membershipId: string): Promise<void>;
  // events
  createEvent(e: Omit<CampusEvent, 'id' | 'approval' | 'createdAt' | 'organizerId'>): Promise<string>;
  decideEvent(eventId: string, decision: Exclude<Approval, 'pending'>): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  rsvp(eventId: string, status: 'going' | 'maybe'): Promise<'going' | 'waitlist' | 'maybe'>;
  cancelRsvp(eventId: string): Promise<void>;
  checkIn(rsvpId: string, value: boolean): Promise<void>;
  // comms & office hours
  postAnnouncement(a: { title: string; body: string; scope: 'campus' | 'department' | 'course' | 'club'; scopeId?: string; pinned?: boolean }): Promise<void>;
  addOfficeHour(o: { day: number; start: string; end: string; placeId: string }): Promise<void>;
  bookOfficeHour(id: string): Promise<void>;
  cancelOfficeHour(id: string): Promise<void>;
  markNoticesRead(): Promise<void>;
}

export interface Store {
  readonly kind: 'demo' | 'firebase';
  getState(): DB;
  subscribe(fn: () => void): () => void;
  /** The signed-in (or impersonated) person id. */
  actorId: string | null;
  actions: Actions;
}
