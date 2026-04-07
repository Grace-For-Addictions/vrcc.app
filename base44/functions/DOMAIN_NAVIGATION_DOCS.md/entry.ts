# Domain-Based Navigation System Documentation

**Version**: 2.0 (Post Phase 3 Consolidation)  
**Last Updated**: February 12, 2026  
**Status**: ✅ Production Ready

---

## Overview

The GFA VRCC application uses a **domain-based navigation system** that organizes features into logical functional areas. This improves user experience by reducing cognitive load and making features easier to discover.

### Key Principles

1. **Domain Grouping**: Related features are grouped under domain labels (e.g., "My Journey", "Connect", "Resources")
2. **Role-Based Access**: Navigation automatically filters based on user role and readiness level
3. **Consistent Structure**: Same navigation pattern across desktop and mobile
4. **Breadcrumb Context**: Users always know where they are in the application hierarchy

---

## Domain Structure

### Participant Domains

These domains are visible to all participants (regular users):

| Domain | Label | Purpose | Pages Included |
|--------|-------|---------|----------------|
| **Participant Journey** | My Journey | Personal recovery path tracking | Home, My GFA Plan, My Services |
| **Community & Peer** | Connect | Social support and engagement | Community, Walls, Events, Grace Match |
| **Resources** | Resources | External resource directory | Find Resources |
| **Learning & Growth** | Learn & Grow | Educational content & progress | Brain Science, Recovery Garden, Progress, Assessment |

### Staff Domains

Additional domains visible to staff members:

| Domain | Label | Purpose | Roles |
|--------|-------|---------|-------|
| **Care Coordination** | Coordination | Service coordination & intake | Coordinator, Navigator, Admin |
| **Services** | Services | Coaching and meetings | Peer Coach, Admin |
| **Provider Network** | Providers | Provider management | Coordinator, Admin |
| **Administration** | Analytics | Reporting and governance | Admin only |

### Cross-Cutting

| Domain | Label | Always Visible | Purpose |
|--------|-------|----------------|---------|
| **Crisis Support** | Crisis Help | ✅ Yes (all users) | Emergency resources |
| **AI Companion** | Chat with Grace | ✅ Yes (all users) | 24/7 AI support |

---

## Navigation Implementation

### File Structure

```
Layout.js                         # Main navigation container
components/navigation/
  ├── Breadcrumbs.jsx            # Breadcrumb trail component
  └── RoleBasedNav.jsx           # RBAC filtering logic
```

### Navigation Object Structure

**Location**: `Layout.js` lines 32-65

```javascript
const domainNavigation = {
  participant: {
    label: 'My Journey',
    items: [
      { name: 'Home', href: 'Home', icon: Home },
      { name: 'My GFA Plan', href: 'MyGFAPlan', icon: Heart },
      { name: 'My Services', href: 'MyServicePortal', icon: Sprout }
    ]
  },
  community: {
    label: 'Connect',
    items: [
      { name: 'Community', href: 'Community', icon: Users },
      { name: 'Walls', href: 'CommunityWalls', icon: Heart },
      { name: 'Events', href: 'Events', icon: Calendar },
      { name: 'Grace Match', href: 'PeerMatching', icon: Sparkles }
    ]
  },
  resources: {
    label: 'Resources',
    items: [
      { name: 'Find Resources', href: 'Resources', icon: MapPin }
    ]
  },
  learning: {
    label: 'Learn & Grow',
    items: [
      { name: 'Brain Science', href: 'Neuroplasticity', icon: Brain },
      { name: 'Recovery Garden', href: 'RecoveryGarden', icon: Flower2 },
      { name: 'Progress', href: 'Gamification', icon: Award },
      { name: 'Assessment', href: 'Assessment', icon: Compass }
    ]
  }
};
```

### Admin Navigation

**Location**: `Layout.js` lines 67-70

```javascript
const adminNavItems = [
  { name: 'Admin Analytics', href: 'AdminDashboard', icon: Shield },
  { name: 'RecoveryCon Portal', href: 'GovDashPortal', icon: Award }
];
```

---

## How to Add a New Page to Navigation

### Step 1: Create the Page

```bash
# Create your page file
pages/MyNewFeature.js
```

### Step 2: Add Domain Header Comment

```javascript
// ============================================================================
// DOMAIN: [Domain Name]
// PURPOSE: [Brief description of what this page does]
// DEPENDENCIES: [What entities/services it uses]
// ============================================================================
```

### Step 3: Add to Navigation Object

**Location**: `Layout.js` → `domainNavigation` object

```javascript
const domainNavigation = {
  participant: {
    label: 'My Journey',
    items: [
      { name: 'Home', href: 'Home', icon: Home },
      // ADD YOUR NEW PAGE HERE 👇
      { name: 'My New Feature', href: 'MyNewFeature', icon: Star },
    ]
  },
  // ... other domains
};
```

**Navigation Item Properties**:
- `name`: Display label (shown to users)
- `href`: Page name (must match file name without .js)
- `icon`: Lucide React icon component

### Step 4: Add to Breadcrumb Mapping

**Location**: `components/navigation/Breadcrumbs.jsx` → `pageToDomainMap`

```javascript
const pageToDomainMap = {
  // ... existing mappings
  'MyNewFeature': 'My Journey',  // Map page to domain
};
```

**Optional**: Add friendly name to `pageNameMap`:

```javascript
const pageNameMap = {
  // ... existing mappings
  'MyNewFeature': 'My Cool Feature',
};
```

### Step 5: Update RBAC Rules (if needed)

**Location**: `components/navigation/RoleBasedNav.jsx`

If your page requires special access control:

```javascript
export function getRoleNavItems(userRole, isAdmin, readinessLevel, consentAcknowledged) {
  // Add your page to appropriate role's allowed list
  if (userRole === 'peer_coach') {
    return {
      show: ['Home', 'MyNewFeature', ...],
      hide: []
    };
  }
  // ...
}
```

### Step 6: Test

1. ✅ Page appears in navigation for correct roles
2. ✅ Breadcrumb shows correct domain
3. ✅ Active state highlights when on page
4. ✅ Mobile menu includes the page
5. ✅ RBAC filtering works as expected

---

## Breadcrumb System

### How Breadcrumbs Work

Breadcrumbs automatically display:
```
Home > [Domain Name] > [Page Name]
```

**Example**: On the Community page:
```
Home > Connect > Community
```

### Implementation Details

**Component**: `components/navigation/Breadcrumbs.jsx`

- **Auto-generated**: No manual configuration per page
- **Domain mapping**: Uses `pageToDomainMap` to determine domain
- **Friendly names**: Uses `pageNameMap` for display names
- **Hidden on Home**: Breadcrumbs don't show on the home page

### Adding Breadcrumb Support for New Pages

1. Add page to `pageToDomainMap` (required)
2. Add page to `pageNameMap` (optional, for friendly names)

```javascript
// In Breadcrumbs.jsx
const pageToDomainMap = {
  'YourNewPage': 'Connect',  // Which domain does this belong to?
};

const pageNameMap = {
  'YourNewPage': 'Awesome Feature',  // Optional friendly name
};
```

---

## Role-Based Access Control (RBAC)

### Navigation Filtering Logic

**Location**: `components/navigation/RoleBasedNav.jsx`

The `getRoleNavItems()` function determines which pages a user can see:

```javascript
getRoleNavItems(userRole, isAdmin, readinessLevel, consentAcknowledged)
```

### Access Levels

| User Type | Navigation Access |
|-----------|------------------|
| **Not Logged In** | Crisis, Resources, Home (public pages) |
| **Participant (Level 1)** | Home, Community, Resources, Brain Science |
| **Participant (Level 2+)** | Full participant domains |
| **Peer Coach** | Participant domains + Services (coaching) |
| **Coordinator** | Participant domains + Care Coordination |
| **Admin** | All domains + Admin Analytics + RecoveryCon Portal |

### Readiness Gating

Some pages require minimum readiness levels:

```javascript
// Example: My GFA Plan requires level 2
if (readinessLevel < 2) {
  return {
    show: basePages,
    hide: ['MyGFAPlan', 'MyServicePortal']
  };
}
```

### Adding Role Requirements for New Pages

```javascript
// In RoleBasedNav.jsx
export function getRoleNavItems(userRole, isAdmin, readinessLevel, consentAcknowledged) {
  
  // Example: Page only for coordinators
  if (userRole === 'coordinator') {
    return {
      show: ['Home', 'YourNewPage', ...],
      hide: []
    };
  }
  
  // Example: Page requires readiness level 3
  if (readinessLevel < 3) {
    return {
      show: basePages,
      hide: ['YourAdvancedPage']
    };
  }
}
```

---

## Mobile vs Desktop Navigation

### Desktop Navigation

- **Layout**: Horizontal bar with domain groupings
- **Separators**: Vertical lines between domains
- **Admin Items**: Red styling, right-aligned
- **Breakpoint**: Visible at `lg` (1024px+)

### Mobile Navigation

- **Layout**: Slide-in menu from right
- **Organization**: Vertical list with domain section headers
- **Headers**: Uppercase gray labels (e.g., "MY JOURNEY")
- **Auto-close**: Menu closes after selecting an item
- **Breakpoint**: Visible below `lg` (< 1024px)

### Styling Differences

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Direction | Horizontal | Vertical |
| Grouping | Domain sections inline | Domain sections stacked |
| Quick Access | Buttons in header | Buttons at bottom of menu |
| User Menu | Dropdown | Part of menu |

---

## Icons

### Available Icons

All icons from **Lucide React** are available:

```javascript
import { 
  Home, Users, MapPin, Heart, Calendar, Brain,
  Compass, MessageCircle, Sparkles, Shield, Award 
} from 'lucide-react';
```

### Icon Guidelines

1. **Consistent size**: All nav icons are `w-4 h-4` or `w-5 h-5`
2. **Semantic meaning**: Choose icons that represent the function
3. **Domain consistency**: Use similar icon styles within a domain

### Recommended Icons by Domain

| Domain | Suggested Icons |
|--------|----------------|
| Participant Journey | Home, Heart, Sprout, Compass |
| Community | Users, MessageCircle, Calendar, Sparkles |
| Resources | MapPin, Book, Archive, ExternalLink |
| Learning | Brain, Award, TrendingUp, Target |
| Coordination | Activity, Network, UserPlus, ClipboardCheck |
| Services | Briefcase, Calendar, Users, Phone |
| Admin | Shield, BarChart, Settings, Database |

---

## Styling Reference

### Active Page Styling

```javascript
// Desktop
className="bg-teal-50 text-teal-700"  // Active page
className="text-gray-600 hover:bg-gray-50 hover:text-gray-900"  // Inactive

// Mobile
className="bg-teal-50 text-teal-700"  // Active page
className="text-gray-600 hover:bg-gray-50"  // Inactive
```

### Admin Item Styling

```javascript
// Desktop - Red accent for admin-only pages
className="bg-red-50 text-red-700 border border-red-200"  // Active
className="text-red-600 hover:bg-red-50"  // Inactive
```

### Domain Section Headers (Mobile)

```javascript
className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4"
```

---

## Quick Reference

### Adding a Simple Participant Page

1. **Create**: `pages/MyPage.js`
2. **Add Domain Comment**:
   ```javascript
   // DOMAIN: Community & Peer Support
   ```
3. **Update Layout.js**:
   ```javascript
   community: {
     items: [
       { name: 'My Page', href: 'MyPage', icon: Star }
     ]
   }
   ```
4. **Update Breadcrumbs.jsx**:
   ```javascript
   pageToDomainMap: {
     'MyPage': 'Connect'
   }
   ```

### Adding an Admin-Only Page

1. **Create**: `pages/AdminFeature.js`
2. **Add Domain Comment**:
   ```javascript
   // DOMAIN: Administration & Governance
   ```
3. **Update Layout.js** (`adminNavItems`):
   ```javascript
   const adminNavItems = [
     { name: 'Admin Feature', href: 'AdminFeature', icon: Shield }
   ];
   ```
4. **Update Breadcrumbs.jsx**:
   ```javascript
   pageToDomainMap: {
     'AdminFeature': 'Administration'
   }
   ```

### Adding a Coach-Only Page

1. **Create**: `pages/CoachTool.js`
2. **Update RoleBasedNav.jsx**:
   ```javascript
   if (userRole === 'peer_coach') {
     return {
       show: ['CoachTool', ...],
       hide: []
     };
   }
   ```
3. **Add to navigation and breadcrumbs** (same as above)

---

## Common Patterns

### Multi-Role Access

```javascript
// Page visible to coaches AND coordinators
if (userRole === 'peer_coach' || userRole === 'coordinator') {
  show.push('SharedToolPage');
}
```

### Conditional Items Based on Readiness

```javascript
// Different pages for different readiness levels
if (readinessLevel === 1) {
  show.push('BeginnerResources');
} else if (readinessLevel >= 3) {
  show.push('AdvancedTools');
}
```

### Feature Flags (Future)

```javascript
// Show beta features only to certain users
if (user.beta_tester) {
  show.push('BetaFeature');
}
```

---

## Testing Your Changes

### Manual Testing Checklist

- [ ] Page appears in correct domain section
- [ ] Icon displays correctly
- [ ] Active state highlights on current page
- [ ] Mobile menu includes the page
- [ ] Breadcrumb shows correct domain
- [ ] RBAC filtering works (test as different roles)
- [ ] No console errors

### Test Multiple Roles

Use the role switcher or create test accounts:

```javascript
// Test as participant
user_role: 'participant'

// Test as peer coach
user_role: 'peer_coach'

// Test as coordinator
user_role: 'coordinator'

// Test as admin
role: 'admin'
```

---

## Troubleshooting

### Page not appearing in navigation

1. ✅ Check spelling of `href` matches page file name exactly
2. ✅ Verify user role has access in `getRoleNavItems()`
3. ✅ Check readiness level requirements
4. ✅ Ensure page is not in `hide` array

### Breadcrumb not showing

1. ✅ Add page to `pageToDomainMap` in Breadcrumbs.jsx
2. ✅ Verify domain name matches exactly
3. ✅ Check that page is not `Home` (breadcrumbs hidden on home)

### Icon not displaying

1. ✅ Import icon from lucide-react
2. ✅ Use PascalCase icon name (e.g., `MessageCircle`)
3. ✅ Check icon exists in Lucide library

### Active state not highlighting

1. ✅ Verify `currentPageName` prop is passed to Layout
2. ✅ Check `currentPageName === item.href` logic
3. ✅ Ensure page name matches navigation href exactly

---

## Migration Notes

### Pre-Phase 3 → Post-Phase 3

**What Changed**:
- ❌ **Old**: Flat navigation list
- ✅ **New**: Domain-grouped navigation

**Breaking Changes**: None (backward compatible)

**Deprecated**: Old navigation patterns still work but should be updated to domain structure

---

## Future Enhancements

### Planned Improvements

1. **Nested Domains**: Support sub-navigation within domains
2. **Search in Nav**: Quick-find navigation items
3. **Recently Visited**: Show recently accessed pages
4. **Favorites**: Pin frequently used pages
5. **Keyboard Shortcuts**: Quick navigation with keyboard
6. **User Customization**: Let users reorder navigation

### Contribution Guidelines

When adding new domains or restructuring navigation:

1. **Update This Document**: Keep navigation docs current
2. **Test All Roles**: Verify RBAC filtering works
3. **Update Testing Guide**: Add new test cases
4. **Screenshot**: Capture before/after for audit trail
5. **Team Review**: Get sign-off on major changes

---

## Contact

**Questions about navigation?**
- See: `NAVIGATION_AUDIT.md` for design decisions
- See: `NAVIGATION_TESTING_GUIDE.md` for testing procedures
- See: `DOMAINS.md` for full domain taxonomy

**Navigation Owner**: Platform Team  
**Last Reviewed**: February 12, 2026  
**Next Review**: March 2026

---

## Summary

✅ **Domain-based navigation**: Organized into logical functional areas  
✅ **Role-based filtering**: Automatic based on user permissions  
✅ **Breadcrumb context**: Always know where you are  
✅ **Mobile-first design**: Consistent experience across devices  
✅ **Easy to extend**: Follow simple steps to add new pages  

**Result**: Cleaner, more intuitive navigation that scales with the application's growth.