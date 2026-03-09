"use client"
import React from 'react'
import Link from 'next/link'
import { useGetCategoryTree } from '@/hooks/useCategory';
import Container from '@/components/ui/Container';
import clsx from 'clsx';

const Navbar = () => {
    const { data: treeResponse, isLoading } = useGetCategoryTree();
    const treeData = treeResponse?.data || [];

    // Filter top-level items that have "Header" in their showcase array
    const categories = treeData.filter(cat => cat.showcase?.includes('Header'));

    return (
        <Container>
            <nav className="relative hidden xl:block">
                <div className="flex justify-between items-center py-4 xl:justify-center">
                    <ul className="hidden xl:flex w-full justify-between text-[16px] font-semibold text-[#4D4E58] items-center min-h-[30px]">
                        {isLoading ? (
                            <div className="flex justify-center w-full">
                                <div className="h-4 w-4 border-2 border-[#e09a74] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : categories.length > 0 ? (
                            categories.map((item) => (
                                <li key={item._id}
                                    className={clsx(
                                        "cursor-pointer whitespace-nowrap hover:text-[#e09a74] transition-colors px-2",
                                        item.name?.toLowerCase() === 'new' && "text-orange-500 text-xl hover:text-orange-700 font-bold"
                                    )}>
                                    <Link href={`/productlist?category=${item._id}`}>
                                        {item.name}
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <li className="text-gray-400 text-xs italic">Set showcase to "Header" in admin to show categories here</li>
                        )}
                    </ul>
                </div>
            </nav>
        </Container>
    )
}

export default Navbar
