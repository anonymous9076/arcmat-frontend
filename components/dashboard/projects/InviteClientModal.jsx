'use client';

import { useState } from 'react';
import { Mail, Loader2, X, Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import axios from 'axios';
import { toast } from 'sonner';

export default function InviteClientModal({ isOpen, onClose, projectId, projectName }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/invite-client`,
                { email },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.status === 'successful') {
                toast.success('Invitation sent successfully!');
                setEmail('');
                onClose();
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast.error(error.response?.data?.message || 'Failed to send invitation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="relative p-8">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>

                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 bg-[#fef7f2] rounded-2xl flex items-center justify-center mb-6">
                            <Mail className="w-8 h-8 text-[#d9a88a]" />
                        </div>
                        <h2 className="text-2xl font-black text-[#2d3142] mb-2">Invite Client</h2>
                        <p className="text-gray-500 font-medium">
                            Invite your client to view <span className="text-[#d9a88a] font-bold">"{projectName}"</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                                Client's Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="client@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#d9a88a]/20 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full bg-[#d9a88a] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-100 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Sending Invitation...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Send Professional Invite
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-xs text-gray-400 font-medium">
                        They will receive a beautifully formatted email with a link to view the project overview.
                    </p>
                </div>
            </div>
        </div>
    );
}
