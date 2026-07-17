// Demo-only mock member identity.
//
// The real app should replace this with a lookup against your purchase /
// session-booking records (e.g. "does this user have an active package or a
// booked therapy session?"). For now, Live Support is gated on this mock.
//
// When you integrate this into your Member Dashboard later, swap this
// file's contents for a real check — nothing downstream needs to change,
// since everything just reads `isMember` and `mockMember`.

export const isMember = true;

export const mockMember = {
  id: 'member_demo_001',
  name: 'Jordan Rivera',
  email: 'jordan.rivera@example.com',
};
