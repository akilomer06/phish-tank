import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AVATARS, profileSchema, type Profile } from '@phish-tank/shared';

interface Preferences {
  muted: boolean;
  profile: Profile;
  toggleMute: () => void;
  saveProfile: (profile: Profile) => void;
}
export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      muted: false,
      profile: { name: '', avatar: AVATARS[0] },
      toggleMute: () => set((state) => ({ muted: !state.muted })),
      saveProfile: (profile) => set({ profile }),
    }),
    {
      name: 'phish-tank-preferences',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current;
        const record = persisted as Record<string, unknown>;
        const parsed = profileSchema.safeParse(record.profile);
        return {
          ...current,
          muted:
            typeof record.muted === 'boolean' ? record.muted : current.muted,
          profile: parsed.success ? parsed.data : current.profile,
        };
      },
    },
  ),
);
