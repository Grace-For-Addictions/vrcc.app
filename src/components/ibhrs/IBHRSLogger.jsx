import { base44 } from '@/api/base44Client';

/**
 * Centralized IBHRS logging utility for the entire app
 * Ensures all service events are tracked for Iowa HHS compliance
 */
export class IBHRSLogger {
  
  /**
   * Log a peer support interaction
   */
  static async logPeerSupport({ userId, county, durationMinutes, outcomeData }) {
    try {
      await base44.entities.IBHRSServiceEvent.create({
        participant_id: userId,
        service_type: 'peer_support',
        service_date: new Date().toISOString().split('T')[0],
        duration_minutes: durationMinutes || 30,
        setting: 'virtual',
        county: county || 'Dallas',
        provider_credential: 'CPS',
        outcome_measure: {
          functional_improvement: outcomeData?.functionalImprovement || false,
          recovery_capital_increase: outcomeData?.recoveryCapitalIncrease || 0,
          linkage_to_care: outcomeData?.linkageToCare || false
        }
      });
    } catch (error) {
      console.error('IBHRS logging failed:', error);
    }
  }

  /**
   * Log a crisis intervention
   */
  static async logCrisisIntervention({ userId, county, crisisAverted }) {
    try {
      await base44.entities.IBHRSServiceEvent.create({
        participant_id: userId,
        service_type: 'crisis_intervention',
        service_date: new Date().toISOString().split('T')[0],
        duration_minutes: 45,
        setting: 'virtual',
        county: county || 'Dallas',
        provider_credential: 'CPS',
        outcome_measure: {
          crisis_averted: crisisAverted,
          functional_improvement: crisisAverted
        }
      });
    } catch (error) {
      console.error('IBHRS logging failed:', error);
    }
  }

  /**
   * Log a group session attendance
   */
  static async logGroupSession({ userId, county, sessionType }) {
    try {
      await base44.entities.IBHRSServiceEvent.create({
        participant_id: userId,
        service_type: 'group_session',
        service_date: new Date().toISOString().split('T')[0],
        duration_minutes: 60,
        setting: 'virtual',
        county: county || 'Dallas',
        provider_credential: 'CPS',
        outcome_measure: {
          functional_improvement: true,
          recovery_capital_increase: 2
        }
      });
    } catch (error) {
      console.error('IBHRS logging failed:', error);
    }
  }

  /**
   * Log recovery coaching session
   */
  static async logRecoveryCoaching({ userId, county, coachId, skillsPracticed }) {
    try {
      await base44.entities.IBHRSServiceEvent.create({
        participant_id: userId,
        service_type: 'recovery_coaching',
        service_date: new Date().toISOString().split('T')[0],
        duration_minutes: 45,
        setting: 'virtual',
        county: county || 'Dallas',
        provider_credential: 'CPS',
        outcome_measure: {
          functional_improvement: true,
          recovery_capital_increase: 3
        }
      });
    } catch (error) {
      console.error('IBHRS logging failed:', error);
    }
  }

  /**
   * Log assessment completion
   */
  static async logAssessment({ userId, county, assessmentScore }) {
    try {
      await base44.entities.IBHRSServiceEvent.create({
        participant_id: userId,
        service_type: 'assessment',
        service_date: new Date().toISOString().split('T')[0],
        duration_minutes: 20,
        setting: 'virtual',
        county: county || 'Dallas',
        provider_credential: 'CPS',
        outcome_measure: {
          functional_improvement: assessmentScore > 50,
          recovery_capital_increase: Math.floor(assessmentScore / 10)
        }
      });
    } catch (error) {
      console.error('IBHRS logging failed:', error);
    }
  }

  /**
   * Log warm handoff to provider
   */
  static async logWarmHandoff({ userId, county, providerId, serviceNeeded }) {
    try {
      await base44.entities.IBHRSServiceEvent.create({
        participant_id: userId,
        service_type: 'warm_handoff',
        service_date: new Date().toISOString().split('T')[0],
        duration_minutes: 30,
        setting: 'virtual',
        county: county || 'Dallas',
        provider_credential: 'CPS',
        outcome_measure: {
          linkage_to_care: true,
          functional_improvement: true
        }
      });
    } catch (error) {
      console.error('IBHRS logging failed:', error);
    }
  }

  /**
   * Log digital equity support
   */
  static async logDigitalEquitySupport({ userId, county, supportType }) {
    try {
      await base44.entities.IBHRSServiceEvent.create({
        participant_id: userId,
        service_type: 'digital_equity_support',
        service_date: new Date().toISOString().split('T')[0],
        duration_minutes: 20,
        setting: 'virtual',
        county: county || 'Dallas',
        provider_credential: 'CPS',
        outcome_measure: {
          functional_improvement: true,
          recovery_capital_increase: 1
        }
      });
    } catch (error) {
      console.error('IBHRS logging failed:', error);
    }
  }

  /**
   * Log school prevention session
   */
  static async logSchoolPrevention({ schoolName, county, studentsReached, gradeLevel }) {
    try {
      await base44.entities.SchoolPreventionSession.create({
        school_name: schoolName,
        county: county || 'Dallas',
        session_date: new Date().toISOString().split('T')[0],
        grade_level: gradeLevel,
        students_reached: studentsReached,
        curriculum_module: 'neuroplasticity_basics',
        opioid_settlement_funded: true
      });
    } catch (error) {
      console.error('IBHRS logging failed:', error);
    }
  }
}

export default IBHRSLogger;