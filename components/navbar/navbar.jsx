"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { NavbarItem } from "./navbar-item";
import { MegaMenu } from "./mega-menu";
import Container from "@/components/ui/Container";
import { useGetCategoryTree } from "@/hooks/useCategory";
import { getCategoryImageUrl } from "@/lib/productUtils";

const Navbar = () => {
    const { data: categoryTree, isLoading } = useGetCategoryTree();
    const [activeItem, setActiveItem] = useState(null);
    const scrollContainerRef = useRef(null);
    const timeoutRef = useRef(null);

    const navItems = useMemo(() => {
        const categories = categoryTree?.data || categoryTree;
        if (!categories || !Array.isArray(categories)) return [];

        const dynamicItems = categories
            .filter(cat => cat.showcase?.includes('Header'))
            .map(cat => {
                return {
                    name: cat.name,
                    id: cat._id || cat.id,
                    image: cat.image ? getCategoryImageUrl(cat.image) : null,
                    isSpecial: false,
                    hasDropdown: cat.children && cat.children.length > 0,
                    categoryData: cat,
                    categories: cat.children ? cat.children.map(subCat => {
                        const l3Links = subCat.children ? subCat.children.map(c => c.name) : [];
                        const columns = [];
                        for (let i = 0; i < l3Links.length; i += 4) {
                            columns.push(l3Links.slice(i, i + 4));
                        }

                        return {
                            name: subCat.name,
                            id: subCat._id || subCat.id,
                            hasSubmenu: subCat.children && subCat.children.length > 0,
                            links: columns,
                            children: subCat.children
                        };
                    }) : []
                };
            });

        return dynamicItems;
    }, [categoryTree]);

    const handleMouseEnter = (itemName) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const item = navItems.find(i => i.name === itemName);
        if (item?.hasDropdown) {
            setActiveItem(itemName);
        } else {
            setActiveItem(null);
        }
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setActiveItem(null);
        }, 150);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    const activeNavItem = navItems.find(item => item.name === activeItem);

    return (
        <>
            <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

            <nav className="relative bg-white border-b border-[hsl(30,15%,90%)] z-45  hidden lg:block">
                <Container>
                    <div className="w-full py-3 relative flex items-center">

                        <div
                            ref={scrollContainerRef}
                            className="flex-1 overflow-x-hidden"
                        >
                            <ul className="flex items-center justify-between w-full min-h-[44px]">
                                {isLoading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <li key={i} className="h-8 w-24 bg-gray-100 animate-pulse rounded-full"></li>
                                    ))
                                ) : (
                                    navItems.map((item, index) => (
                                        <NavbarItem
                                            key={item.name}
                                            item={item}
                                            isFirst={index === 0}
                                            activeItem={activeItem}
                                            onMouseEnter={handleMouseEnter}
                                            onMouseLeave={handleMouseLeave}
                                        />
                                    ))
                                )}
                            </ul>
                        </div>

                        {/* Mega Menu Rendered Here - Outside Overflow Container but Inside Relative Container */}
                        {activeNavItem && activeNavItem.hasDropdown && (
                            <div
                                className="absolute left-1/2 -translate-x-1/2 top-full z-50"
                                onMouseEnter={() => handleMouseEnter(activeNavItem.name)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <MegaMenu
                                    item={activeNavItem}
                                    setActiveItem={(name) => handleMouseEnter(name)}
                                    handleMouseLeave={handleMouseLeave}
                                />
                            </div>
                        )}

                    </div>
                </Container>
            </nav>
        </>
    );
};

export default Navbar;
