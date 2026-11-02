/**
 * Notifications are created here, on the server, instead of by whichever client triggered the change.
 * That lets security rules forbid clients from writing notices for other people.
 * Each builder is pure: (before, after) -> notices. The id is derived from the triggering event, so a retried
 * delivery rewrites the same document instead of creating a duplicate.
 */
export interface NoticeDraft { personId: string; title: string; body: string; link?: string }
type Doc = Record<string, any> | undefined;

export const forGrade = (after: Doc, before?: Doc): NoticeDraft[] =>
  after && after.grade && after.grade !== before?.grade ? [{ personId: after.studentId, title: 'Grade posted', body: `Your final grade for ${String(after.sectionId).replace(/^sec-/, '').toUpperCase()} is ${after.grade}.`, link: '/academics' }] : [];

export const forAssignment = (after: Doc, enrolledStudentIds: string[]): NoticeDraft[] =>
  after ? enrolledStudentIds.map(personId => ({ personId, title: 'New assignment', body: String(after.title), link: '/academics' })) : [];

export const forJoinRequest = (after: Doc, before: Doc, clubName: string, presidentId: string): NoticeDraft[] => {
  if (!after) return [];
  if (!before) return [{ personId: presidentId, title: 'New join request', body: `Someone wants to join ${clubName}.`, link: `/clubs/${after.clubId}` }];
  return before.status !== after.status && after.status !== 'pending'
    ? [{ personId: after.personId, title: `Join request ${after.status}`, body: `${clubName}: your request was ${after.status}.`, link: `/clubs/${after.clubId}` }] : [];
};

export const forClubDecision = (after: Doc, before: Doc): NoticeDraft[] =>
  after && before && before.approval !== after.approval && after.approval !== 'pending'
    ? [{ personId: after.presidentId, title: `Club ${after.approval}`, body: `${after.name} was ${after.approval}.`, link: `/clubs/${after.id}` }] : [];

export const forEventDecision = (after: Doc, before: Doc): NoticeDraft[] =>
  after && before && before.approval !== after.approval && after.approval !== 'pending'
    ? [{ personId: after.organizerId, title: `Event ${after.approval}`, body: `${after.title} was ${after.approval}.`, link: `/events/${after.id}` }] : [];

export const forRoleDecision = (after: Doc, before: Doc): NoticeDraft[] =>
  after && before && before.status !== after.status && after.status !== 'pending'
    ? [{ personId: after.personId, title: `Role request ${after.status}`, body: `Your request to become ${String(after.requested).replace('_', ' ')} was ${after.status}.` }] : [];

export const forSeatPromotion = (after: Doc, before: Doc, what: 'enrollment' | 'rsvp', label: string): NoticeDraft[] => {
  if (!after || !before) return [];
  const promoted = what === 'enrollment' ? before.status === 'waitlisted' && after.status === 'enrolled' : before.status === 'waitlist' && after.status === 'going';
  const personId = what === 'enrollment' ? after.studentId : after.personId;
  return promoted ? [{ personId, title: what === 'enrollment' ? 'Enrolled from waitlist' : "You're off the waitlist", body: what === 'enrollment' ? `A seat opened up in ${label} and you were enrolled.` : `A spot opened up for ${label}.`, link: what === 'enrollment' ? '/academics' : undefined }] : [];
};
