// store/useSidebarStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSidebarStore = create(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      isFolderAnimating: false,
      toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleMobileSidebar: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      setMobileOpen: (isOpen) => set({ isMobileOpen: isOpen }),
      triggerFolderAnimation: () => {
        set({ isFolderAnimating: true });
        setTimeout(() => set({ isFolderAnimating: false }), 5000);
      },
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);