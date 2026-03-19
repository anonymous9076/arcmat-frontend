"use client"
import React, { useState } from 'react'
import { formatCurrency, getColorCode } from '@/lib/productUtils'

const filterCategories = [
    "Brand",
    "Price Range",
    "Color",
    "City",
]

const ToggleSwitch = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <span className="text-[15px] font-medium text-gray-700">{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e09a74]"></div>
        </label>
    </div>
)

const ProductSidebar = ({
    activeFilters,
    setActiveFilters,
    brands = [],
    availableColors = [],
    availableAttributes = [], // New prop
    minPrice = 0,
    maxPrice = 100000,
    priceStep = 100
}) => {
    const handleToggleChange = (toggleName, val) => {
        setActiveFilters(prev => ({
            ...prev,
            toggles: { ...prev.toggles, [toggleName]: val }
        }))
    }

    const handleBrandChange = (brandId, checked) => {
        setActiveFilters(prev => ({
            ...prev,
            brands: checked
                ? [...prev.brands, brandId]
                : prev.brands.filter(id => id !== brandId)
        }))
    }

    const handlePriceChange = (index, value) => {
        const newRange = [...activeFilters.priceRange];
        newRange[index] = Number(value);
        setActiveFilters(prev => ({
            ...prev,
            priceRange: newRange
        }));
    }

    const handleColorChange = (color, checked) => {
        setActiveFilters(prev => ({
            ...prev,
            colors: checked
                ? [...prev.colors, color]
                : prev.colors.filter(c => c !== color)
        }))
    }

    const handleCityChange = (city, checked) => {
        setActiveFilters(prev => ({
            ...prev,
            cities: checked
                ? [...prev.cities, city]
                : (prev.cities || []).filter(c => c !== city)
        }))
    }

    const handleAvailabilityChange = (status, checked) => {
        setActiveFilters(prev => ({
            ...prev,
            availability: checked
                ? [...prev.availability, status]
                : (prev.availability || []).filter(s => s !== status)
        }))
    }

    const handleAttributeChange = (key, value, checked) => {
        setActiveFilters(prev => {
            const currentValues = (prev.attributes || {})[key] || [];
            const newValues = checked
                ? [...currentValues, value]
                : currentValues.filter(v => v !== value);

            const updatedAttributes = {
                ...(prev.attributes || {}),
                [key]: newValues
            };

            // Remove key if empty
            if (newValues.length === 0) {
                delete updatedAttributes[key];
            }

            return {
                ...prev,
                attributes: updatedAttributes
            };
        });
    }

    const clearAll = () => {
        setActiveFilters({
            brands: [],
            colors: [],
            cities: [],
            availability: [],
            attributes: {}, // Reset attributes
            priceRange: [minPrice, maxPrice],
            toggles: {
                commercial: false,
                residential: false,
                allColorways: false
            }
        })
    }

    const [openSections, setOpenSections] = useState({ "Brand": true, "Price Range": true })

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    // Combine static and dynamic categories
    const allCategories = React.useMemo(() => {
        const dynamicCats = availableAttributes.map(attr => attr.key);
        // Avoid duplicates if a dynamic attribute has the same name as a static one
        const filteredDynamic = dynamicCats.filter(cat => !filterCategories.includes(cat));
        return [...filterCategories, ...filteredDynamic];
    }, [availableAttributes]);

    return (
        <aside className="w-full h-full border-r-2 border-gray-200 overflow-y-auto no-scrollbar py-2 pr-6 pb-20">
            <div className="flex items-center justify-end mb-2">
                {(activeFilters.brands.length > 0 ||
                    activeFilters.colors.length > 0 ||
                    Object.keys(activeFilters.attributes || {}).some(key => activeFilters.attributes[key].length > 0) ||
                    Object.values(activeFilters.toggles).some(v => v) ||
                    activeFilters.priceRange[0] !== minPrice ||
                    activeFilters.priceRange[1] !== maxPrice) && (
                        <button
                            onClick={clearAll}
                            className="text-[12px] font-semibold text-[#e09a74] hover:underline cursor-pointer"
                        >
                            Clear All
                        </button>
                    )}
            </div>

            <div className="flex flex-col mb-4">
                <ToggleSwitch
                    label="Commercial"
                    checked={activeFilters.toggles.commercial}
                    onChange={(val) => handleToggleChange('commercial', val)}
                />
                <ToggleSwitch
                    label="Residential"
                    checked={activeFilters.toggles.residential}
                    onChange={(val) => handleToggleChange('residential', val)}
                />
                <ToggleSwitch
                    label="All Colorways"
                    checked={activeFilters.toggles.allColorways}
                    onChange={(val) => handleToggleChange('allColorways', val)}
                />
            </div>

            <div className="mt-2">
                {allCategories.map((cat, idx) => (
                    <AccordionItem
                        key={idx}
                        title={cat}
                        isOpen={openSections[cat]}
                        onToggle={() => toggleSection(cat)}
                    >
                        {cat === "Brand" && (
                            <div className="flex flex-col gap-2.5 mt-1">
                                {brands.map(brand => (
                                    <label key={brand._id || brand.id} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:bg-[#e09a74] checked:border-[#e09a74] transition-all"
                                                checked={activeFilters.brands.includes(brand._id || brand.id)}
                                                onChange={(e) => handleBrandChange(brand._id || brand.id, e.target.checked)}
                                            />
                                            <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        <span className="text-[15px] text-gray-600 group-hover:text-gray-900 transition-colors">{brand.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {cat === "Price Range" && (
                            <div className="px-1 pt-2 pb-4">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Min</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                                <input
                                                    type="number"
                                                    value={activeFilters.priceRange[0]}
                                                    onChange={(e) => handlePriceChange(0, e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#e09a74]"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Max</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                                <input
                                                    type="number"
                                                    value={activeFilters.priceRange[1]}
                                                    onChange={(e) => handlePriceChange(1, e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#e09a74]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* <div className="relative h-6 flex items-center group">
                                        <input
                                            type="range"
                                            min={minPrice}
                                            max={maxPrice}
                                            step={priceStep}
                                            value={activeFilters.priceRange[1]}
                                            onChange={(e) => handlePriceChange(1, e.target.value)}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#e09a74]"
                                        />
                                    </div> */}
                                </div>
                            </div>
                        )}

                        {cat === "Color" && (
                            <div className="flex flex-col gap-2.5 mt-1">
                                {availableColors.map(color => (
                                    <label key={color} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:bg-[#e09a74] checked:border-[#e09a74] transition-all"
                                                checked={activeFilters.colors.includes(color)}
                                                onChange={(e) => handleColorChange(color, e.target.checked)}
                                            />
                                            <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        <span className="text-[15px] text-gray-600 group-hover:text-gray-900 transition-colors uppercase">{color}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {cat === "City" && (
                            <div className="flex flex-col gap-2.5 mt-1">
                                {["Mumbai", "Delhi", "Bangalore", "Gurgaon", "Pune", "Hyderabad"].map(city => (
                                    <label key={city} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:bg-[#e09a74] checked:border-[#e09a74] transition-all"
                                                checked={(activeFilters.cities || []).includes(city)}
                                                onChange={(e) => handleCityChange(city, e.target.checked)}
                                            />
                                            <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        <span className="text-[15px] text-gray-600 group-hover:text-gray-900 transition-colors">{city}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Generic Attribute Renderer */}
                        {!filterCategories.includes(cat) && availableAttributes.find(a => a.key === cat) && (
                            <div className="flex flex-col gap-2.5 mt-1">
                                {availableAttributes.find(a => a.key === cat).values.map(val => (
                                    <label key={val} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:bg-[#e09a74] checked:border-[#e09a74] transition-all"
                                                checked={((activeFilters.attributes || {})[cat] || []).includes(val)}
                                                onChange={(e) => handleAttributeChange(cat, val, e.target.checked)}
                                            />
                                            <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        <span className="text-[15px] text-gray-600 group-hover:text-gray-900 transition-colors">{val}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </AccordionItem>
                ))}
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </aside>
    )
}

const AccordionItem = ({ title, isOpen, onToggle, children }) => (
    <div className="border-b border-gray-100">
        <button
            className="flex items-center justify-between w-full py-4 text-left focus:outline-none"
            onClick={onToggle}
        >
            <span className="text-[16px] font-bold text-gray-800">{title}</span>
            {isOpen ? (
                <img className="w-3 h-3 grayscale opacity-60" src="/Icons/angle-up-svgrepo-com.svg" alt="" />
            ) : (
                <img className="grayscale opacity-60" src="/Icons/Vector (3).svg" alt="" />
            )}
        </button>
        {isOpen && (
            <div className="pb-5">
                {children}
            </div>
        )}
    </div>
)

export default ProductSidebar
