# Navigation Testing Guide - Task 3.6
**Domain-Based Navigation Testing Checklist**

---

## Role-Based Navigation Testing

### Test Account Setup
Create test accounts for each role:
- [ ] **Participant** (regular user, no special role)
- [ ] **Peer Coach** (user_role: 'peer_coach')
- [ ] **Coordinator** (user_role: 'coordinator' or 'navigator')
- [ ] **Administrator** (role: 'admin' or user_role: 'administrator')

---

## ✅ Participant Navigation Test

**Login as**: Regular participant (no admin role, user_role: 'participant')

### Expected Visible Domains:
- [x] **My Journey**
  - [ ] Home
  - [ ] My GFA Plan
  - [ ] My Services

- [x] **Connect**
  - [ ] Community
  - [ ] Walls
  - [ ] Events
  - [ ] Grace Match

- [x] **Resources**
  - [ ] Find Resources

- [x] **Learn & Grow**
  - [ ] Brain Science
  - [ ] Recovery Garden
  - [ ] Progress
  - [ ] Assessment

- [x] **Quick Access (Always Visible)**
  - [ ] Crisis Help (orange button)
  - [ ] Chat with Grace (teal button)

### Should NOT See:
- [ ] Admin Analytics
- [ ] RecoveryCon Portal
- [ ] Any admin-only beacons

**Test Actions**:
1. [ ] Click each navigation item - should navigate successfully
2. [ ] Check mobile menu - should show 4 domain sections
3. [ ] Verify breadcrumbs appear on all pages except Home
4. [ ] Test navigation from Home page beacons
5. [ ] Confirm user menu has Grace Match, My Assessment, My Service Portal

---

## ✅ Peer Coach Navigation Test

**Login as**: Peer coach (user_role: 'peer_coach')

### Expected Additional Access:
- [x] **Services** (in addition to participant nav)
  - [ ] Coach Dashboard
  - [ ] Coaching Logger

### Should See Same as Participant Plus:
- [ ] All participant domains
- [ ] Coach-specific pages in Services

**Test Actions**:
1. [ ] Verify coach dashboard is accessible
2. [ ] Check coaching analytics/logger tools
3. [ ] Confirm participant features still visible

---

## ✅ Coordinator/Navigator Test

**Login as**: Coordinator or Navigator (user_role: 'coordinator' or 'navigator')

### Expected Additional Access:
- [x] **Care Coordination**
  - [ ] Service Coordination Hub
  - [ ] Intake Dashboard
  - [ ] Navigator Dashboard
  - [ ] Resource Navigator Dashboard

### Should See:
- [ ] All participant domains
- [ ] Coordination-specific pages
- [ ] Provider network access

**Test Actions**:
1. [ ] Access Service Coordination Hub
2. [ ] Navigate to Intake Dashboard
3. [ ] Test Navigator Dashboard
4. [ ] Verify resource moderation access

---

## ✅ Administrator Test

**Login as**: Admin (role: 'admin' or user_role: 'administrator')

### Expected Full Access:
- [x] **All participant domains**
- [x] **All staff domains**
- [x] **Admin Analytics** (red highlight)
  - [ ] Admin Dashboard
- [x] **RecoveryCon Portal** (red highlight)

### Should See:
- [ ] Admin Analytics in main nav (red styling)
- [ ] RecoveryCon Portal in main nav (red styling)
- [ ] All admin-only beacons on Home page:
  - [ ] IBHRS Reporting
  - [ ] Grant Writer
  - [ ] Admin Dashboard
  - [ ] BeePurple Reporting

**Test Actions**:
1. [ ] Access Admin Dashboard (real-time analytics)
2. [ ] Access RecoveryCon Portal (governance)
3. [ ] Verify all admin-only features visible
4. [ ] Test grant writing station
5. [ ] Check IBHRS reporting access

---

## Mobile Navigation Testing

### Mobile Menu (< 768px)

**Test on**: Phone simulator or resize browser to <768px

1. [ ] **Hamburger Menu Opens/Closes**
   - Click menu icon (☰)
   - Menu slides in from right
   - Click X to close
   - Click outside menu to close

2. [ ] **Domain Sections Display**
   - [ ] "MY JOURNEY" header visible (gray uppercase)
   - [ ] "CONNECT" header visible
   - [ ] "RESOURCES" header visible
   - [ ] "LEARN & GROW" header visible
   - Each section has proper spacing

3. [ ] **Navigation Items**
   - [ ] All items have icons + text
   - [ ] Touch targets are large (py-3)
   - [ ] Active page has teal background
   - [ ] Hover states work on touch

4. [ ] **Quick Access Buttons**
   - [ ] Crisis Help button (full width)
   - [ ] Chat with Grace button (full width)
   - Both appear at bottom of menu

5. [ ] **Auto-Close on Navigation**
   - Click any nav item
   - Menu should close automatically
   - Should navigate to correct page

---

## Desktop Navigation Testing

### Desktop Menu (≥ 1024px)

1. [ ] **Domain Grouping**
   - [ ] 4 domain groups visible horizontally
   - [ ] Visual separators (vertical lines) between domains
   - [ ] Items within domain grouped together
   - [ ] No wrapping on standard desktop (1920px)

2. [ ] **Hover States**
   - [ ] Items have gray background on hover
   - [ ] Smooth transition animation
   - [ ] Cursor changes to pointer

3. [ ] **Active States**
   - [ ] Current page has teal background
   - [ ] Text is teal-700
   - [ ] Clear visual distinction

4. [ ] **Admin Items (if admin)**
   - [ ] Red border and background on admin items
   - [ ] Separated from participant nav
   - [ ] Shield icon visible

---

## Breadcrumb Testing

### Breadcrumb Display

1. [ ] **Home Page**
   - No breadcrumbs shown (expected)

2. [ ] **Domain Pages**
   - [ ] Home > [Domain] > [Page Name]
   - Example: Home > Connect > Community

3. [ ] **Breadcrumb Links**
   - [ ] Home link navigates to Home page
   - [ ] Domain name is not clickable (just label)
   - [ ] Current page name is bold

4. [ ] **Breadcrumb Styling**
   - [ ] ChevronRight icons between items
   - [ ] Proper spacing
   - [ ] Responsive on mobile

---

## RBAC (Role-Based Access Control) Testing

### Readiness Gating

**Test with**: New participant (readiness_level: 1)

1. [ ] **Level 1 Access**
   - [ ] Home visible
   - [ ] Community visible
   - [ ] Resources visible
   - [ ] Brain Science visible
   - [ ] Assessment visible

2. [ ] **Level 1 Restrictions**
   - [ ] Some advanced features hidden
   - [ ] Check `getRoleNavItems()` logic

**Test with**: Established participant (readiness_level: 2+)

3. [ ] **Full Participant Access**
   - [ ] All participant domains visible
   - [ ] My GFA Plan visible
   - [ ] My Services visible
   - [ ] Recovery Garden visible
   - [ ] Progress visible

### Consent-Based Gating

**Test with**: User without consent (consent_acknowledged: false)

1. [ ] **Pre-Consent Access**
   - [ ] Limited to public pages
   - [ ] Home visible
   - [ ] Resources visible
   - [ ] Crisis visible

**Test with**: User with consent (consent_acknowledged: true)

2. [ ] **Post-Consent Access**
   - [ ] Full navigation visible
   - [ ] All domains accessible

---

## Performance Testing

### Navigation Speed

1. [ ] **Initial Load**
   - [ ] Navigation renders immediately
   - [ ] No layout shift after user loads
   - [ ] Icons load without delay

2. [ ] **Navigation Transitions**
   - [ ] Page transitions are smooth
   - [ ] Active state updates instantly
   - [ ] Mobile menu animation is smooth (no lag)

3. [ ] **RBAC Filtering**
   - [ ] Navigation filters on mount (no flash of hidden items)
   - [ ] Role detection is instant

---

## Accessibility Testing

### Keyboard Navigation

1. [ ] **Tab Navigation**
   - Tab through all nav items
   - Focus visible on each item
   - Skip to main content link available

2. [ ] **Screen Reader**
   - [ ] Nav has `aria-label`
   - [ ] Breadcrumbs have `aria-label="Breadcrumb"`
   - [ ] Active page has `aria-current="page"`

3. [ ] **Focus Management**
   - [ ] Focus moves to content on navigation
   - [ ] Mobile menu traps focus when open
   - [ ] Escape closes mobile menu

---

## Cross-Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## User Feedback Collection

### Team Review

1. [ ] **Executive Director Review**
   - Domain labels make sense?
   - Navigation intuitive?
   - Any missing critical pages?

2. [ ] **Clinical Staff Review**
   - Care coordination easily accessible?
   - Coach tools findable?
   - Participant journey clear?

3. [ ] **Peer Coach Review**
   - Can coaches find their tools quickly?
   - Is Grace Match prominent enough?
   - Any confusion on domain grouping?

4. [ ] **Participant Testing**
   - Can new participants find resources?
   - Is "My Journey" clear?
   - Too many options or just right?

### Feedback Questions

1. "How quickly can you find [specific feature]?"
2. "Do the domain labels make sense to you?"
3. "Is anything hard to find?"
4. "Would you prefer a different organization?"
5. "Does the mobile menu work well for you?"

---

## Common Issues Checklist

### Known Potential Issues

- [ ] **Long Nav on Small Laptops**
  - Test on 1366x768 screens
  - Ensure no wrapping or horizontal scroll

- [ ] **Mobile Menu Overlap**
  - Verify menu doesn't cover critical content
  - Z-index conflicts with modals

- [ ] **RBAC Edge Cases**
  - User with multiple roles
  - User role transitions (participant → coach)
  - No role assigned

- [ ] **Breadcrumb Mapping Gaps**
  - Pages not in `pageToDomainMap`
  - New pages added without breadcrumb update

---

## Final Sign-Off

| Tester | Role | Test Completed | Issues Found | Sign-Off | Date |
|--------|------|---------------|--------------|----------|------|
| _______ | Participant | ☐ | _______ | ☐ | _____ |
| _______ | Peer Coach | ☐ | _______ | ☐ | _____ |
| _______ | Coordinator | ☐ | _______ | ☐ | _____ |
| _______ | Admin | ☐ | _______ | ☐ | _____ |
| _______ | Mobile Tester | ☐ | _______ | ☐ | _____ |
| _______ | Accessibility | ☐ | _______ | ☐ | _____ |

---

## Screenshots Needed

**Before/After Comparison** (for documentation):

1. [ ] **Desktop Navigation** (before domain consolidation) - archived
2. [ ] **Desktop Navigation** (after domain consolidation) - current
3. [ ] **Mobile Navigation** (before) - archived
4. [ ] **Mobile Navigation** (after) - current
5. [ ] **Breadcrumbs** (example on 3 different pages)
6. [ ] **Role-Based Views** (participant vs admin nav comparison)

---

## Next Steps After Testing

1. [ ] **Compile Feedback**
   - Document all tester feedback
   - Identify common pain points
   - Prioritize issues

2. [ ] **Make Refinements**
   - Fix critical bugs
   - Adjust labels if confusing
   - Optimize domain groupings if needed

3. [ ] **Update Documentation**
   - Update NAVIGATION_AUDIT.md with final state
   - Document any changes from original design
   - Note lessons learned

4. [ ] **Deploy to Production**
   - Staged rollout?
   - Feature flag?
   - Monitor analytics post-launch

---

**Testing Status**: 🔄 Ready for Manual Testing  
**Estimated Testing Time**: 2-3 hours (all roles + devices)  
**Completion Criteria**: All role-based access verified, no navigation bugs, team sign-off received