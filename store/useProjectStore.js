import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useProjectStore = create(
    persist(
        (set) => ({
            activeProjectId: null,
            activeProjectName: null,
            activeMoodboardId: null,
            activeMoodboardName: null,

            setActiveProject: (id, name) => set({
                activeProjectId: id,
                activeProjectName: name,
                activeMoodboardId: null, // Clear moodboard if project changes
                activeMoodboardName: null
            }),

            setActiveMoodboard: (id, name, projectId, projectName) => set({
                activeProjectId: projectId || null,
                activeProjectName: projectName || null,
                activeMoodboardId: id,
                activeMoodboardName: name
            }),

            clearActiveProject: () => set({
                activeProjectId: null,
                activeProjectName: null,
                activeMoodboardId: null,
                activeMoodboardName: null
            }),
        }),
        {
            name: 'active-project-storage',
        }
    )
);

export default useProjectStore;
