import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageHeader, Card } from '@/src/ui';

export default function Info() {
  const privacy = useLocation().pathname === '/privacy';
  return (
    <>
      <Link to="/me" className="mb-3 inline-block text-sm font-bold text-secondary hover:underline">← Me</Link>
      <PageHeader title={privacy ? 'Privacy' : 'About Commons'} />
      <Card className="max-w-2xl space-y-4 text-base font-medium leading-relaxed">
        {privacy ? (<>
          <p>Commons shows campus information such as classes, clubs and events, filtered by your role.</p>
          <p><b>Demo mode</b> stores sample data only in this browser. Nothing is sent anywhere.</p>
          <p><b>Visibility.</b> Students see their own grades and attendance. Instructors see only the students enrolled in their own sections. Club rosters are visible to campus members. Administrators can see user accounts and an audit log of privileged actions.</p>
          <p>This page is a placeholder. Replace it with your institution's actual privacy policy before a real launch.</p></>) : (<>
          <p>Commons brings a campus into one app: academics, departments, clubs, events and people, with access that depends on whether you are a student, faculty member, department head, staff member or administrator.</p>
          <p>This build runs on sample data. Use the account switcher to explore each role.</p></>)}
      </Card>
    </>
  );
}
