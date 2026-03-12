'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HelpCircle, ChevronRight, ChevronLeft, Plus,
  Package, Tags, Layers, Heart, ShoppingBag, User, Users,
  LayoutDashboard, Image, HardHat, Store, Palette,
  PlayCircle, BarChart3, Briefcase, MessageSquare
} from 'lucide-react';
import clsx from 'clsx';
import useAuthStore from '@/store/useAuthStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import SidebarItem from './SidebarItem';
import SidebarUser from './SidebarUser';
import sidebarData from './sidebar-data.json';
import CreateProjectModal from './CreateProjectModal';
import Button from '@/components/ui/Button';
import { useGetProjects } from '@/hooks/useProject';
import { useGetRetailerAssignedRequests } from '@/hooks/useRetailerRequest';

const ICON_MAP = {
  Package, Tags, Layers, HelpCircle, ShoppingBag, Heart,
  User, Users, LayoutDashboard, Image, HardHat, Store,
  Palette, PlayCircle, BarChart3, Briefcase, MessageSquare
};

const mapIcons = (items) => items.map(item => ({ ...item, icon: ICON_MAP[item.icon] }));

const BRAND_MENU_ITEMS = mapIcons(sidebarData.BRAND_MENU_ITEMS);
const USER_MENU_ITEMS = mapIcons(sidebarData.USER_MENU_ITEMS);
const RETAILER_MENU_ITEMS = mapIcons(sidebarData.RETAILER_MENU_ITEMS);
const ARCHITECT_MENU_ITEMS = mapIcons(sidebarData.ARCHITECT_MENU_ITEMS);

export default function Sidebar() {
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebarStore();
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isBrand = user?.role === 'brand' || user?.role === 'vendor';
  const isRetailer = user?.role === 'retailer';
  const isArchitect = user?.role === 'architect';
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const { data: projectsData } = useGetProjects();
  const { data: retailerRequestsData } = useGetRetailerAssignedRequests({ enabled: isRetailer });

  const projects = projectsData?.data || [];
  const retailerRequests = retailerRequestsData?.data || [];

  // BUG FIX 2: Explicitly sum only `unreadMessages` (non-retailer general messages)
  // so architect's retailer chat unread count never bleeds into the projects badge
  const totalUnread = projects.reduce((acc, p) => acc + (p.unreadMessages || 0), 0);

  const totalRetailerUnread = isArchitect
    ? projects.reduce((acc, p) => acc + (p.unreadRetailerMessages || 0), 0)
    : retailerRequests.reduce((acc, r) => acc + (r.unreadMessages || 0), 0);

  useEffect(() => {
    setMounted(true);
    setMobileOpen(false);
    // BUG FIX 3: Added setMobileOpen to dependency array to avoid stale closure
  }, [setMobileOpen]);

  useEffect(() => {
    if (isMobileOpen) {
      setMobileOpen(false);
    }
    // BUG FIX 3: Added isMobileOpen and setMobileOpen to dependency array
  }, [pathname, isMobileOpen, setMobileOpen]);

  const menuItems = (!mounted || !user)
    ? USER_MENU_ITEMS
    : (isAdmin || isBrand
      ? BRAND_MENU_ITEMS
      : isRetailer
        ? RETAILER_MENU_ITEMS
        : isArchitect
          ? ARCHITECT_MENU_ITEMS
          : USER_MENU_ITEMS);

  const visibleItems = menuItems
    .map(item => {
      if (isBrand && item.id === 'products-list' && (user?._id || user?.id)) {
        return { ...item, href: `/dashboard/products-list/${user._id || user.id}` };
      }

      // BUG FIX 1: Apply project unread badge only to the relevant item per role.
      // Architects use 'all-projects', customers/others use 'collaborations'.
      // Previously BOTH items received the badge simultaneously.
      if (mounted) {
        const projectsBadgeId = isArchitect ? 'all-projects' : 'collaborations';
        if (item.id === projectsBadgeId) {
          // BUG FIX 4: Only set badge when count is > 0 to avoid rendering "0" bubble
          return { ...item, badge: totalUnread > 0 ? totalUnread : undefined };
        }

        if (item.id === 'retailer-contacts' && isArchitect) {
          return { ...item, badge: totalRetailerUnread > 0 ? totalRetailerUnread : undefined };
        }

        if (item.id === 'architect-requests' && isRetailer) {
          return { ...item, badge: totalRetailerUnread > 0 ? totalRetailerUnread : undefined };
        }
      }

      if (isBrand && item.id === 'analytics') {
        return { ...item, href: '/dashboard/analytics/brand' };
      }

      return item;
    })
    .filter(item => {
      if (!mounted) return item.id === 'dashboard';
      if (item.requiresAuth && !isAuthenticated) return false;
      if ((item.id === 'categories' || item.id === 'attributes' || item.id === 'users' || item.id === 'homepage') && !isAdmin) return false;
      if (item.brandOnly && !isBrand) return false;
      if (item.retailerOnly && !isRetailer) return false;
      if (item.id === 'boards' && user?.professionalType === 'Contractor / Builder') return false;
      return true;
    });

  const currentCollapsed = mounted ? isCollapsed : false;
  const safeCollapsed = isMobileOpen ? false : currentCollapsed;

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        suppressHydrationWarning
        className={clsx(
          "fixed md:relative z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300 flex flex-col shrink-0",
          safeCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <button
          onClick={toggleSidebar}
          suppressHydrationWarning
          className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 hidden md:flex hover:bg-[#d9a88a] z-50 shadow-sm"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div
          className={clsx(
            "p-6 flex flex-col h-full overflow-x-hidden",
            safeCollapsed ? "overflow-hidden" : "overflow-y-auto"
          )}
          suppressHydrationWarning
        >
          <SidebarUser isCollapsed={safeCollapsed} mounted={mounted} />

          {isArchitect && (
            <Button
              onClick={() => setIsProjectModalOpen(true)}
              className={clsx(
                "mb-8 flex items-center justify-center bg-[#d9a88a] hover:bg-white text-white hover:text-[#d9a88a] hover:border-[#d9a88a] border rounded-full h-10 transition-all shadow-sm overflow-hidden",
                safeCollapsed ? "px-0 w-10 mx-auto" : "px-4 w-full"
              )}
            >
              <Plus className={clsx("w-5 h-5 shrink-0 transition-all", !safeCollapsed && "mr-2")} />
              <span className={clsx(
                "font-medium text-sm transition-all duration-300 overflow-hidden whitespace-nowrap",
                safeCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"
              )}>
                New project
              </span>
            </Button>
          )}

          <nav className="flex-1 space-y-2">
            {visibleItems.map((item) => (
              <SidebarItem key={item.id} item={item} isCollapsed={safeCollapsed} />
            ))}
          </nav>
        </div>
      </aside>

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </>
  );
}