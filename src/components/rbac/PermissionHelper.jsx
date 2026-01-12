// GFA RBAC Permission Helper
// Implements trauma-informed, person-first access control

export const ROLES = {
  PARTICIPANT: 'participant',
  PEER_SUPPORT: 'peer_support',
  PROGRAM_STAFF: 'program_staff',
  ADMINISTRATOR: 'administrator',
  EXECUTIVE: 'executive'
};

// Object-level permissions by role
export const PERMISSIONS = {
  [ROLES.PARTICIPANT]: {
    profile: { read: true, write: 'self_only' },
    goals_journey: { read: true, write: true },
    session_notes: { read: 'own_only', write: false },
    daily_outreach_logs: { access: false },
    resource_requests: { create: true, read: 'own_only', edit: false },
    care_alerts: { read: 'limited', write: false },
    reports_dashboards: { read: 'personal_only' },
    audit_logs: { access: false }
  },
  
  [ROLES.PEER_SUPPORT]: {
    participants: { read: 'assigned_only' },
    session_notes: { create: true, edit: 'own_only', delete: false },
    daily_outreach_logs: { create: true, read: 'assigned_only' },
    resource_requests: { create: true, approve: false },
    care_alerts: { create: true, read: 'assigned_only' },
    incident_reports: { access: false },
    reports_dashboards: { read: 'limited' }
  },
  
  [ROLES.PROGRAM_STAFF]: {
    participants: { read: 'program_scope' },
    session_notes: { read: true, edit: 'comments_only' },
    resource_requests: { approve: true, edit: true },
    care_alerts: { approve: true, edit: true },
    incident_reports: { create: true, read: true },
    reports_dashboards: { read: true }
  },
  
  [ROLES.ADMINISTRATOR]: {
    users_roles: { assign: true },
    all_records: { read: true },
    reports_dashboards: { read: true, export: true },
    workflow_automation: { edit: true },
    audit_logs: { read: true },
    narrative_content: { edit: false }
  },
  
  [ROLES.EXECUTIVE]: {
    dashboards: { read: 'aggregated_only' },
    population_insights: { read: 'deidentified' },
    funding_grants: { read: true },
    reports: { generate: true },
    narrative_story_bank: { read: 'approved_only' },
    individual_records: { access: false }
  }
};

// Check if user has permission for a specific object/action
export const hasPermission = (userRole, object, action) => {
  if (!userRole) return false;
  
  // Admins bypass most checks
  if (userRole === ROLES.ADMINISTRATOR) {
    // Except narrative content editing
    if (object === 'narrative_content' && action === 'edit') return false;
    return true;
  }
  
  const rolePermissions = PERMISSIONS[userRole];
  if (!rolePermissions || !rolePermissions[object]) return false;
  
  const objectPerms = rolePermissions[object];
  return objectPerms[action] === true || objectPerms.access === true;
};

// Check conditional permissions (e.g., "own_only", "assigned_only")
export const hasConditionalPermission = (userRole, object, action, context = {}) => {
  const rolePermissions = PERMISSIONS[userRole];
  if (!rolePermissions || !rolePermissions[object]) return false;
  
  const objectPerms = rolePermissions[object];
  const permValue = objectPerms[action] || objectPerms.read;
  
  if (permValue === true) return true;
  if (permValue === false || permValue === undefined) return false;
  
  // Handle conditional permissions
  if (permValue === 'self_only' || permValue === 'own_only') {
    return context.created_by === context.current_user_email;
  }
  
  if (permValue === 'assigned_only') {
    return context.assigned_coach === context.current_user_email;
  }
  
  if (permValue === 'program_scope') {
    // Would check program/county affiliation
    return true; // Simplified
  }
  
  return false;
};

// Language enforcement rules
export const LANGUAGE_RULES = {
  prohibited_terms: ['relapse', 'clean', 'dirty', 'addict', 'junkie'],
  replacement_map: {
    'relapse': 'return to use',
    'clean': 'in recovery',
    'dirty': 'using',
    'addict': 'person with substance use disorder'
  },
  diagnosis_fields_hidden_for: [ROLES.PEER_SUPPORT]
};

// Enforce person-first language
export const enforceLanguage = (text, userRole) => {
  if (!text) return text;
  
  let correctedText = text;
  Object.entries(LANGUAGE_RULES.replacement_map).forEach(([term, replacement]) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    correctedText = correctedText.replace(regex, replacement);
  });
  
  return correctedText;
};

// Check if field should be hidden based on role
export const shouldHideField = (fieldName, userRole) => {
  if (fieldName.includes('diagnosis') || fieldName.includes('clinical')) {
    return LANGUAGE_RULES.diagnosis_fields_hidden_for.includes(userRole);
  }
  return false;
};

// Readiness gates
export const READINESS_GATES = {
  intake_complete: {
    unlocks: ['daily_support', 'CoachDashboard']
  },
  orientation_complete: {
    unlocks: ['peer_assignment']
  },
  peer_assigned: {
    unlocks: ['coaching_active']
  },
  coaching_active: {
    unlocks: ['resource_requests', 'CoachingLogger']
  }
};

export const isFeatureUnlocked = (featureName, userProfile) => {
  if (!userProfile) return false;
  
  // Check each gate
  if (READINESS_GATES.intake_complete.unlocks.includes(featureName)) {
    return userProfile.intake_completed === true;
  }
  
  if (READINESS_GATES.coaching_active.unlocks.includes(featureName)) {
    return userProfile.assigned_coach !== null;
  }
  
  return true; // Default to unlocked for undefined features
};

// Care alert escalation rules
export const CARE_ALERT_THRESHOLDS = {
  disengagement_days: 7,
  escalation_path: [ROLES.PROGRAM_STAFF, ROLES.ADMINISTRATOR]
};

// UI tooltips
export const TOOLTIPS = {
  goals: "These are directions you've chosen, not expectations.",
  progress: "Progress includes pauses, pivots, and persistence.",
  session_notes: "Document dignity first. Behavior follows belief.",
  care_alert: "Raising a flag is an act of care, not failure.",
  approvals: "Timely decisions protect trust and momentum.",
  audit_logs: "Transparency protects people and the mission.",
  roi_dashboard: "Numbers tell a story. People are the story."
};

export const getTooltip = (key) => TOOLTIPS[key] || '';