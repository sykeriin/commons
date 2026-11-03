export type Role = 'student' | 'faculty' | 'staff' | 'dept_head' | 'admin';
export type ClubRole = 'member' | 'officer' | 'president' | 'advisor';
export type Approval = 'pending' | 'approved' | 'rejected';

export interface Person {
  id: string;
  name: string;
  email: string;
  role: Role;
  title?: string;            // e.g. "Associate Professor"
  departmentId?: string;
  programId?: string;
  year?: number;             // student year 1-4
  bio?: string;
  office?: string;
  karma: number;
  photoURL?: string;
}

export interface Department {
  id: string; name: string; code: string; color: string;
  headId?: string; description: string; building: string;
}
export interface Program { id: string; departmentId: string; name: string; degree: 'BSc' | 'BA' | 'MSc' | 'PhD'; credits: number }

export interface MeetingSlot { day: 0 | 1 | 2 | 3 | 4 | 5 | 6; start: string; end: string; placeId: string } // day: 0=Sun
export interface Course {
  id: string; code: string; title: string; departmentId: string; credits: number; description: string;
}
export interface Section {
  id: string; courseId: string; term: string; instructorId: string; capacity: number; slots: MeetingSlot[];
}
export interface Enrollment { id: string; sectionId: string; studentId: string; status: 'enrolled' | 'waitlisted' | 'dropped'; grade?: string }
export interface Assignment {
  id: string; sectionId: string; title: string; description: string; dueAt: string; points: number;
}
export interface Submission { id: string; assignmentId: string; studentId: string; score?: number; submittedAt?: string; feedback?: string }
export interface AttendanceRecord { id: string; sectionId: string; date: string; studentId: string; status: 'present' | 'absent' | 'late' | 'excused' }

export interface Club {
  id: string; name: string; description: string; category: string; color: string;
  presidentId: string; advisorId?: string; joinPolicy?: 'open' | 'request'; approval: Approval; memberCount: number; createdAt: string;
}
export interface ClubMembership { id: string; clubId: string; personId: string; role: ClubRole; joinedAt: string }
export interface JoinRequest { id: string; clubId: string; personId: string; status: Approval; message?: string }

export type EventScope = 'campus' | 'department' | 'club';
export interface CampusEvent {
  id: string; title: string; description: string; category: string; date: string; start: string; end: string;
  placeId: string; scope: EventScope; clubId?: string; departmentId?: string; organizerId: string;
  capacity?: number; approval: Approval; createdAt: string;
}
export interface Rsvp { id: string; eventId: string; personId: string; status: 'going' | 'waitlist' | 'maybe'; checkedIn: boolean; createdAt: string }

export interface Announcement {
  id: string; title: string; body: string; authorId: string; createdAt: string; pinned?: boolean;
  scope: 'campus' | 'department' | 'course' | 'club'; scopeId?: string;
}
export interface OfficeHour { id: string; facultyId: string; day: number; start: string; end: string; placeId: string; booked?: string[] }
export interface RoleRequest { id: string; personId: string; requested: Role; reason: string; status: Approval; createdAt: string }
export interface Notice { id: string; personId: string; title: string; body: string; createdAt: string; read: boolean; link?: string }
export interface AuditEntry { id: string; actorId: string; action: string; target: string; at: string }
export interface Place { id: string; name: string; building: string; kind: 'lecture' | 'lab' | 'hall' | 'outdoor' | 'office' | 'library' | 'sports'; capacity: number }

export interface DB {
  people: Person[]; departments: Department[]; programs: Program[]; courses: Course[]; sections: Section[];
  enrollments: Enrollment[]; assignments: Assignment[]; submissions: Submission[]; attendance: AttendanceRecord[];
  clubs: Club[]; memberships: ClubMembership[]; joinRequests: JoinRequest[]; events: CampusEvent[]; rsvps: Rsvp[];
  announcements: Announcement[]; officeHours: OfficeHour[]; roleRequests: RoleRequest[]; notices: Notice[];
  audit: AuditEntry[]; places: Place[];
}
export const EMPTY_DB: DB = {
  people: [], departments: [], programs: [], courses: [], sections: [], enrollments: [], assignments: [],
  submissions: [], attendance: [], clubs: [], memberships: [], joinRequests: [], events: [], rsvps: [],
  announcements: [], officeHours: [], roleRequests: [], notices: [], audit: [], places: [],
};
