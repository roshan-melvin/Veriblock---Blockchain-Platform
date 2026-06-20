import type { InvestigatorProfile, Publisher } from '../types';

const KEYS = {
  PROFILES: 'veriblock:v1:profiles',
  ACTIVE_PROFILE_ID: 'veriblock:v1:activeProfileId',
  PUBLISHER_KEYS: 'veriblock:v1:publisherKeys',
} as const;

export const storage = {
  getProfiles(): InvestigatorProfile[] {
    try {
      const data = localStorage.getItem(KEYS.PROFILES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading profiles from storage:', e);
      return [];
    }
  },

  saveProfiles(profiles: InvestigatorProfile[]): void {
    try {
      localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.error('Error saving profiles to storage:', e);
    }
  },

  getActiveProfileId(): string | null {
    return localStorage.getItem(KEYS.ACTIVE_PROFILE_ID);
  },

  setActiveProfileId(id: string | null): void {
    if (id) {
      localStorage.setItem(KEYS.ACTIVE_PROFILE_ID, id);
    } else {
      localStorage.removeItem(KEYS.ACTIVE_PROFILE_ID);
    }
  },

  getActiveProfile(): InvestigatorProfile | null {
    const id = this.getActiveProfileId();
    if (!id) return null;
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === id) || null;
  },

  updateActiveProfile(updates: Partial<InvestigatorProfile>): void {
    const id = this.getActiveProfileId();
    if (!id) return;
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates };
      this.saveProfiles(profiles);
    }
  },

  getPublisherKeys(): Publisher[] {
    try {
      const data = localStorage.getItem(KEYS.PUBLISHER_KEYS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading publisher keys from storage:', e);
      return [];
    }
  },

  savePublisherKeys(keys: Publisher[]): void {
    try {
      localStorage.setItem(KEYS.PUBLISHER_KEYS, JSON.stringify(keys));
    } catch (e) {
      console.error('Error saving publisher keys to storage:', e);
    }
  },

  clearAll(): void {
    localStorage.removeItem(KEYS.PROFILES);
    localStorage.removeItem(KEYS.ACTIVE_PROFILE_ID);
    localStorage.removeItem(KEYS.PUBLISHER_KEYS);
  }
};
