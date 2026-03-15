import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Button from '../ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '../ui/Toast'
import {Send } from 'lucide-react'

const RequestInfo = ({ product, initialRequest = {}, onClose, isModal = false }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        profession: 'Profession *',
        company: '',
        city: '',
        address: '',
        no: '',
        postcode: '',
        tel: '',
        message: '',
        catalogue: false,
        priceList: false,
        bimCad: false,
        retailersList: false,
        contactRepresentative: false,
        consent: false,
        ...initialRequest
    });

    useEffect(() => {
        if (user) {
            const names = (user.name || '').split(' ');
            setFormData(prev => ({
                ...prev,
                firstName: names[0] || '',
                lastName: names.slice(1).join(' ') || '',
                email: user.email || '',
                profession: user.profession || 'Profession *',
                city: user.city || '',
                tel: user.mobile || user.tel || ''
            }));
        }
    }, [user]);

    useEffect(() => {
        if (initialRequest && Object.keys(initialRequest).length > 0) {
            setFormData(prev => ({
                ...prev,
                ...initialRequest
            }));
        }
    }, [initialRequest]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.firstName || !formData.email || !formData.city) {
            toast.error('Please fill in all required fields (*)', 'Missing Information');
            return;
        }

        if (!formData.consent) {
            toast.error('Please consent to the processing of your data', 'Consent Required');
            return;
        }

        // Simulate API call
        toast.success('Your request has been sent successfully!', 'Success');
        if (onClose) onClose();
    };

    return (
        <div className="mb-2">

            <div className="bg-[#FFF9E6]">
                <div className="flex items-center gap-2 mb-6 p-1 bg-[#e09a74]">
                    <div className="bg-[#e09a74] rounded-full p-2">
                        <Send className="text-black"/>
                    </div>
                    <div className="flex justify-between items-center w-full pr-2">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">Contact</h2>
                        {isModal && onClose && (
                            <button onClick={onClose} className="text-gray-900 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 py-4 px-4 md:px-6 lg:px-10">
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-4 pb-6 border-b border-gray-300">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Get directly in touch with</p>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {(product.brand && typeof product.brand === 'object') ? (product.brand.name || product.brand.brand_name) : (product.brand || 'Arcmat')}
                                    </h3>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between gap-4 py-2">
                                <div className="flex-1">
                                    <h4 className="text-base font-semibold text-gray-900 mb-3">Request</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="catalogue"
                                                checked={formData.catalogue || false}
                                                onChange={handleChange}
                                                className="w-4 h-4 rounded border-gray-300 text-[#e09a74] focus:ring-[#e09a74]"
                                            />
                                            <span className="text-sm text-gray-700">Catalogue</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="priceList"
                                                checked={formData.priceList || false}
                                                onChange={handleChange}
                                                className="w-4 h-4 rounded border-gray-300 text-[#e09a74] focus:ring-[#e09a74]"
                                            />
                                            <span className="text-sm text-gray-700">Price list</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="bimCad"
                                                checked={formData.bimCad || false}
                                                onChange={handleChange}
                                                className="w-4 h-4 rounded border-gray-300 text-[#e09a74] focus:ring-[#e09a74]"
                                            />
                                            <span className="text-sm text-gray-700">BIM/CAD</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="retailersList"
                                                checked={formData.retailersList || false}
                                                onChange={handleChange}
                                                className="w-4 h-4 rounded border-gray-300 text-[#e09a74] focus:ring-[#e09a74]"
                                            />
                                            <span className="text-sm text-gray-700">Retailers list</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="contactRepresentative"
                                                checked={formData.contactRepresentative || false}
                                                onChange={handleChange}
                                                className="w-4 h-4 rounded border-gray-300 text-[#e09a74] focus:ring-[#e09a74]"
                                            />
                                            <span className="text-sm text-gray-700">Contact representative</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div>
                                        <h4 className="text-base font-semibold text-gray-900 mb-2">Send a message</h4>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent resize-none"
                                            placeholder="Hello, I would like more information about the product FRAME..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-base font-semibold text-gray-900">Fill in your data</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="First Name *"
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent"
                            />
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Last Name *"
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent"
                            />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="E-mail *"
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent"
                            />
                            <select
                                name="profession"
                                value={formData.profession}
                                onChange={handleChange}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent"
                            >
                                <option>Profession *</option>
                                <option>Architect</option>
                                <option>Designer</option>
                                <option>Customer</option>
                                <option>Other</option>
                            </select>
                            <input
                                type="text"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                placeholder="Company/Studio Name"
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent"
                            />
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="City/Town *"
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent"
                            />
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Address"
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent"
                            />
                            <input
                                type="text"
                                name="no"
                                value={formData.no}
                                onChange={handleChange}
                                placeholder="No."
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent"
                            />
                            <input
                                type="text"
                                name="postcode"
                                value={formData.postcode}
                                onChange={handleChange}
                                placeholder="Postcode"
                                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent"
                            />
                            <input
                                type="tel"
                                name="tel"
                                value={formData.tel}
                                onChange={handleChange}
                                placeholder="Tel."
                                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#e09a74] focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">

                        <div className="pt-2">
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="consent"
                                    checked={formData.consent}
                                    onChange={handleChange}
                                    className="w-4 h-4 mt-1 rounded border-gray-300 text-[#e09a74] focus:ring-[#e09a74]"
                                />
                                <span className="text-xs text-gray-600 leading-relaxed">
                                    I consent to the transfer of my data to {(product.brand && typeof product.brand === 'object') ? (product.brand.name || product.brand.brand_name) : (product.brand || 'Arcmat')} and the brands featured on Archiproducts for marketing purposes
                                </span>
                            </label>
                            <p className="text-xs text-gray-500 mt-2 ml-6">
                                By clicking on Send, I consent to register on the site and share my data with the contacted brand so that it can respond to my request. To this end, I accept the{' '}
                                <Link href="/not-found" className="text-[#e09a74] hover:underline">Terms of Use</Link> and the{' '}
                                <Link href="/not-found" className="text-[#e09a74] hover:underline">Privacy Policy</Link> and authorize the processing of my personal data for marketing purposes by Archiproducts. If you are already registered,{' '}
                                <Link href="/not-found" className="text-[#e09a74] hover:underline">Login</Link>
                            </p>
                        </div>

                        <Button
                            text="SEND"
                            onClick={handleSubmit}
                            className="w-full md:w-auto bg-[#e09a74] hover:bg-white hover:text-[#e09a74] border-[#e09a74] border text-white font-semibold py-3 px-8 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RequestInfo
