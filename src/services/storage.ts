
import { Practice, HealthScore, Rescue, TeamMember } from '@/types/accountancy';

export class AccountancyStorage {
  private static PREFIX = 'accountancy_';

  static savePractice(practice: Practice): void {
    if (practice.id.startsWith('practice-')) {
      console.warn('[AccountancyStorage] Refusing to save mock practice data');
      return;
    }
    localStorage.setItem(`${this.PREFIX}practice`, JSON.stringify(practice));
  }

  static getPractice(): Practice | null {
    const saved = localStorage.getItem(`${this.PREFIX}practice`);
    if (!saved) return null;
    
    try {
      const practice = JSON.parse(saved);
      // Don't return mock data
      if (practice.id?.startsWith('practice-')) {
        console.warn('[AccountancyStorage] Found mock practice data, ignoring');
        localStorage.removeItem(`${this.PREFIX}practice`);
        return null;
      }
      return practice;
    } catch {
      return null;
    }
  }

  static saveHealthScore(healthScore: HealthScore): void {
    localStorage.setItem(`${this.PREFIX}health_score`, JSON.stringify(healthScore));
  }

  static getHealthScore(): HealthScore | null {
    const data = localStorage.getItem(`${this.PREFIX}health_score`);
    return data ? JSON.parse(data) : null;
  }

  static saveRescues(rescues: Rescue[]): void {
    localStorage.setItem(`${this.PREFIX}rescues`, JSON.stringify(rescues));
  }

  static getRescues(): Rescue[] {
    const data = localStorage.getItem(`${this.PREFIX}rescues`);
    return data ? JSON.parse(data) : [];
  }

  static saveTeam(team: TeamMember[]): void {
    localStorage.setItem(`${this.PREFIX}team`, JSON.stringify(team));
  }

  static getTeam(): TeamMember[] {
    const data = localStorage.getItem(`${this.PREFIX}team`);
    return data ? JSON.parse(data) : [];
  }

  static clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }

  // Add this new method to clear all accountancy data
  static clearAll(): void {
    const keysToRemove = [
      'accountancy_practice',
      'accountancy_health_score',
      'accountancy_rescues',
      'accountancy_team',
      'accountancy_widget_layout',
      'accountancy_complaints',
      'accountancy_advisory_progress',
      // Add any other accountancy-related keys
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('[AccountancyStorage] Cleared all accountancy data');
  }
}
