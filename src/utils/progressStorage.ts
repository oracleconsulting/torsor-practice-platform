
import { AssessmentProgress } from '@/types/assessmentProgress';

export class ProgressStorage {
  private static getStorageKey(email: string): string {
    return `assessment_progress_${email.toLowerCase()}`;
  }

  static save(email: string, data: AssessmentProgress): void {
    try {
      const key = this.getStorageKey(email);
      const dataWithTimestamp = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
      console.log('Saved progress to localStorage:', dataWithTimestamp);
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
  }

  static load(email: string): AssessmentProgress | null {
    try {
      const key = this.getStorageKey(email);
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Loaded progress from localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading progress from localStorage:', error);
    }
    return null;
  }

  static remove(email: string): void {
    try {
      const key = this.getStorageKey(email);
      localStorage.removeItem(key);
      console.log('Removed progress from localStorage');
    } catch (error) {
      console.error('Error removing progress from localStorage:', error);
    }
  }
}
