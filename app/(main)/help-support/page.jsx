'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateSupportQuery } from '@/hooks/useSupport';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { Mail, MessageCircle, Send, Plus, X, Loader2, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

export default function HelpSupportPage() {
    const { user, isAuthenticated } = useAuth();
    const [formData, setFormData] = useState({
        subject: '',
        query: '',
        attachments: []
    });
    const [uploading, setUploading] = useState(false);

    const createQueryMutation = useCreateSupportQuery();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        // Simulate file upload or use actual upload logic if available
        // For now, we'll use base64 or temporary blobs for demonstration
        try {
            const newAttachments = await Promise.all(
                files.map(file => new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                }))
            );
            setFormData(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...newAttachments]
            }));
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = (index) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            window.location.href = '/auth/login';
            return;
        }

        createQueryMutation.mutate(formData, {
            onSuccess: () => {
                setFormData({ subject: '', query: '', attachments: [] });
            }
        });
    };

    return (
        <div className="bg-gray-50 min-h-screen py-20">
            <Container>
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-16 h-16 bg-[#E09A74]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <MessageCircle className="w-8 h-8 text-[#E09A74]" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Help & Support</h1>
                        <p className="text-lg text-gray-600 font-medium max-w-lg mx-auto leading-relaxed">
                            Need assistance? Our support team is here to help you get the most out of ArcMat.
                        </p>
                    </div>

                    {/* Support Form Card */}
                    <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                        <div className="p-8 md:p-12">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Auto-filled User Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-gray-100">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Your Name</label>
                                        <div className="h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center px-5 text-gray-900 font-bold opacity-70">
                                            {user?.name || 'Guest User'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                                        <div className="h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center px-5 text-gray-900 font-bold opacity-70">
                                            {user?.email || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Subject</label>
                                        <input
                                            type="text"
                                            name="subject"
                                            required
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            placeholder="What can we help you with?"
                                            className="w-full h-14 bg-white border-2 border-gray-50 rounded-2xl px-6 font-bold text-gray-900 focus:border-[#E09A74] focus:ring-0 transition-all placeholder:text-gray-300"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Query Details</label>
                                        <textarea
                                            name="query"
                                            required
                                            rows={5}
                                            value={formData.query}
                                            onChange={handleInputChange}
                                            placeholder="Please describe your issue or question in detail..."
                                            className="w-full bg-white border-2 border-gray-50 rounded-[28px] p-6 font-bold text-gray-900 focus:border-[#E09A74] focus:ring-0 transition-all placeholder:text-gray-300 resize-none"
                                        />
                                    </div>

                                    {/* File Upload */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pl-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attachments (Images)</label>
                                            <span className="text-[10px] font-bold text-[#E09A74]">{formData.attachments.length} files selected</span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                            {formData.attachments.map((src, index) => (
                                                <div key={index} className="aspect-square rounded-2xl bg-gray-100 relative group overflow-hidden border border-gray-200">
                                                    <img src={src} alt="attachment" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAttachment(index)}
                                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}

                                            <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#E09A74] hover:bg-orange-50/30 transition-all group">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    disabled={uploading}
                                                />
                                                {uploading ? (
                                                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Plus className="w-6 h-6 text-gray-300 group-hover:text-[#E09A74] transition-colors" />
                                                        <span className="text-[9px] font-black text-gray-300 group-hover:text-[#E09A74] mt-2 uppercase tracking-tighter">Add Photo</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={createQueryMutation.isPending || !formData.subject || !formData.query}
                                        className="w-full h-16 bg-[#2C2D35] hover:bg-black disabled:bg-gray-100 disabled:text-gray-300 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-gray-200"
                                    >
                                        {createQueryMutation.isPending ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                Submit Ticket
                                                <Send className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                    {!isAuthenticated && (
                                        <p className="text-center text-xs text-red-400 font-bold mt-4 uppercase tracking-widest">You must be logged in to submit a ticket</p>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 text-center text-gray-400">
                        <p className="text-sm font-medium">ArcMat Support Team usually responds within 24-48 business hours.</p>
                    </div>
                </div>
            </Container>
        </div>
    );
}
