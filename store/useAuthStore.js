import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import authService from '../services/authService';

const useAuthStoreBase = create(
  persist(
    (set, get) => ({
      // --- STATE ---
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      currentBrandId: null,
      selectedBrands: [],
      activeBrand: null, // Current brand context (for multi-brand admins)

      // --- ACTIONS ---
      login: (userData, token) => {
        // Normalize: handle API wrappers like { data: user } or { user: user }
        const finalUser = userData?.data || userData?.user || userData;

        const brandId = finalUser?.role === 'brand'
          ? (finalUser.brandId || finalUser.id)
          : null;

        const brands = finalUser?.selectedBrands || [];

        set({
          user: finalUser,
          token: token,
          isAuthenticated: true,
          currentBrandId: brandId,
          selectedBrands: brands,
          activeBrand: brands.length > 0 ? brands[0] : null,
          isLoading: false
        });
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          // 1. Check for token in localStorage
          const token = localStorage.getItem('token');

          if (!token) {
            // No token, ensure we are logged out
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // 2. Fetch User Info
          const rawData = await authService.getUserInfo();

          // 3. Update Store
          // Handle potential API response wrapper (e.g., { data: {...} } or { user: {...} })
          const userData = rawData?.data || rawData?.user || rawData;


          const brandId = userData?.role === 'brand' ? (userData.brandId || userData.id) : null;
          const brands = userData?.selectedBrands || [];

          set({
            user: userData,
            token,
            isAuthenticated: true,
            currentBrandId: brandId,
            selectedBrands: brands,
            activeBrand: brands.length > 0 ? brands[0] : null,
            isLoading: false
          });

        } catch (error) {
          // Token invalid or expired
          get().logout();
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          currentBrandId: null,
          selectedBrands: [],
          activeBrand: null,
          isLoading: false
        });
        localStorage.removeItem('auth-storage');
      },

      fetchUser: async () => {
        // ... (existing fetchUser can delegate to initializeAuth or stay similar)
        // Let's keep it simple and just reuse logic or keep existing but update it.
        // Actually, initializeAuth covers the "refresh" case. fetchUser is explicit.
        // Let's just alias or keep it separate.
        await get().initializeAuth();
      },

      // Helper to manually update role/brandId if needed
      setRole: (role, brandId = null) =>
        set((state) => ({
          user: { ...state.user, role },
          currentBrandId: brandId
        })),

      setActiveBrand: (brandId) => set({ activeBrand: brandId }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Optional: trigger initializeAuth here if desired, but better to do it in a top-level component
      },
    }
  )
);

// --- EXPORTS ---
export const useAuthStore = useAuthStoreBase;
export default useAuthStoreBase;