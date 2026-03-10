"use client";
import React, { useState } from 'react';
import Container from '@/components/ui/Container';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/dashboard/sidebar/Sidebar';
import BasicInfoCard from '@/components/profile/BasicInfoCard';
import ChangePasswordCard from '@/components/profile/ChangePasswordCard';
import BusinessProfileTab from '@/components/profile/BusinessProfileTab';
import RetailerProfileTab from '@/components/profile/RetailerProfileTab';
import { User, Building2, Lock, MapPin, Store } from 'lucide-react';
import AddressList from '@/components/profile/AddressList';
import Footer from '@/components/layouts/Footer';

const ProfilePage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('basic');

    const isBrandRole = user?.role === 'brand';
    const isRetailerRole = user?.role === 'retailer';

    const tabs = [
        { id: 'basic', label: 'Basic Information', icon: User },
        { id: 'address', label: 'Manage Addresses', icon: MapPin },
        ...(isBrandRole ? [{ id: 'business', label: 'Business Profile', icon: Building2 }] : []),
        ...(isRetailerRole ? [{ id: 'retailer', label: 'Retailer Profile', icon: Store }] : []),
        { id: 'password', label: 'Change Password', icon: Lock },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-gray-50 py-10">
                    <Container>
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

                            {/* Tab Navigation */}
                            <div className="flex justify-start sm:justify-around space-x-1 bg-gray-100 p-1 rounded-xl mb-8 overflow-x-auto scrollbar-hide">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                                                ${isActive
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
                                            `}
                                        >
                                            <Icon size={16} className={isActive ? 'text-[#e09a74]' : 'text-gray-400'} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab Content */}
                            <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                                {activeTab === 'basic' && <BasicInfoCard user={user} />}
                                {activeTab === 'address' && <AddressList />}
                                {activeTab === 'business' && isBrandRole && <BusinessProfileTab />}
                                {activeTab === 'retailer' && isRetailerRole && <RetailerProfileTab />}
                                {activeTab === 'password' && <ChangePasswordCard />}
                            </div>
                        </div>
                    </Container>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default ProfilePage;
