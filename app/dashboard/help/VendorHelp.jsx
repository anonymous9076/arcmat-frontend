'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, ExternalLink, HelpCircle, FileSpreadsheet, LayoutList, AlertCircle, ShoppingBag, Layers } from 'lucide-react';
import Container from '@/components/ui/Container';

export default function VendorHelp() {
    return (
        <Container className="py-6 max-w-4xl">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-blue-600" />
                    Help / Brand Guide
                </h1>
                <p className="text-gray-600 text-sm">
                    Master the dashboard to manage your products and catalog efficiently.
                </p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-sm">
                <AccordionItem title="Introduction / Overview" icon={<HelpCircle className="w-4 h-4 text-purple-500" />} defaultOpen={true}>
                    <div className="space-y-4">
                        <p className="text-gray-700 leading-relaxed">
                            Welcome to the Vendor Dashboard! Here you can manage your products, update missing attributes, and monitor your catalog efficiently.
                            Our goal is to help you keep your inventory up-to-date and ready for sale.
                        </p>
                        <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3 border border-blue-100">
                            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-blue-800">
                                <strong>Tip:</strong> Keeping your product attributes complete ensures better visibility and higher sales.
                            </p>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Categories" icon={<Layers className="w-4 h-4 text-indigo-500" />}>
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            The <strong>Categories Page</strong> lists all categories where you have products listed. It gives you a quick health check of your catalog.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
                            <li>See total products per category.</li>
                            <li>Track how many products have incomplete attributes.</li>
                            <li>Use action buttons to quickly jump to the Product List or fix attributes.</li>
                        </ul>
                        <div className="pt-2">
                            <Link
                                href="/dashboard/categories"
                                className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
                            >
                                Go to Categories Page <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Product List" icon={<ShoppingBag className="w-4 h-4 text-emerald-500" />}>
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            The <strong>Product List</strong> shows all your products in a specific category or across your entire inventory.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-1">Key Columns</h4>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• Product Name</li>
                                    <li>• Price & Stock Levels</li>
                                    <li>• Attribute Status (Complete/Incomplete)</li>
                                </ul>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border border-gray-100 flex flex-col justify-center">
                                <p className="text-gray-600">
                                    Click the <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold mx-1">Fix</span> button
                                    next to any incomplete product to open the Add Missing Attributes page directly.
                                </p>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/dashboard/products-list"
                                className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 hover:underline"
                            >
                                Go to Product List <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Add Missing Attributes" icon={<LayoutList className="w-4 h-4 text-orange-500" />}>
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Ensuring your products have all necessary details is crucial. Follow this flow to fix incomplete products:
                        </p>
                        <ol className="list-decimal list-inside space-y-3 text-gray-600 ml-1">
                            <li className="pl-2"><span className="font-medium text-gray-900">Click Fix:</span> From the Product List or Categories page.</li>
                            <li className="pl-2"><span className="font-medium text-gray-900">Fill Details:</span> Enter required attributes like material, color, size, etc.</li>
                            <li className="pl-2"><span className="font-medium text-gray-900">Save:</span> The product's attribute status updates automatically.</li>
                        </ol>
                        <div className="bg-orange-50 p-3 rounded text-orange-800 border border-orange-100">
                            Attributes highlighted in <span className="text-red-600 font-medium">red</span> are required.
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/dashboard/attributes"
                                className="inline-flex items-center gap-2 text-orange-600 font-medium hover:text-orange-700 hover:underline"
                            >
                                Go to Attributes Page <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Bulk Upload" icon={<FileSpreadsheet className="w-4 h-4 text-blue-500" />}>
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Upload multiple products at once using a CSV file. This is the fastest way to add new inventory.
                        </p>
                        <div className="bg-slate-800 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono text-xs">
                            name, categoryPath, price, stock, attributes
                        </div>
                        <p className="text-gray-500">
                            * Note: All new products from bulk upload will automatically have an <span className="font-medium text-gray-700">Attribute Status = Incomplete</span>.
                            You will need to review them to add specific details.
                        </p>
                    </div>
                </AccordionItem>

                <AccordionItem title="FAQ / Tips" icon={<HelpCircle className="w-4 h-4 text-teal-500" />}>
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-gray-900">What happens if I leave a required attribute blank?</h4>
                            <p className="text-gray-600">The product status will remain <strong>incomplete</strong> and may not appear in some search filters.</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-gray-900">Can I edit a product after upload?</h4>
                            <p className="text-gray-600">Yes, you can edit any product at any time via the Product List.</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-gray-900">How do I add a new category?</h4>
                            <p className="text-gray-600">Currently, categories are managed by the system admin. Please contact support if you need a new category added.</p>
                        </div>
                    </div>
                </AccordionItem>
            </div>
        </Container>
    );
}

function AccordionItem({ title, children, icon, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-100 last:border-none">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 ${isOpen ? 'bg-gray-50/50' : ''}`}
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">{icon}</span>}
                    <span className="font-semibold text-gray-900 text-base">{title}</span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 pl-14 pr-8 text-gray-600">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
