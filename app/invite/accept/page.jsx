'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import axios from 'axios';
import { toast } from 'sonner';
import Container from '@/components/ui/Container';

function AcceptInviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const projectId = searchParams.get('projectId');
    const email = searchParams.get('email');

    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [projectName, setProjectName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!projectId || !email) {
            setStatus('error');
            setErrorMessage('Invalid invitation link. Please check your email.');
            return;
        }

        const processAcceptance = async () => {
            try {
                // Introduce a small delay for a smoother premium feel
                await new Promise(resolve => setTimeout(resolve, 1500));

                const response = await axios.patch(
                    `${process.env.NEXT_PUBLIC_API_URL}/project/accept-invite`,
                    { projectId, email }
                );

                if (response.data.status === 'successful') {
                    setStatus('success');
                    setProjectName(response.data.data.projectName);
                    toast.success('Invitation accepted!');
                }
            } catch (error) {
                console.error('Acceptance error:', error);
                setStatus('error');
                setErrorMessage(error.response?.data?.message || 'Failed to accept invitation. It may have expired or already been accepted.');
                toast.error('Failed to accept invitation');
            }
        };

        processAcceptance();
    }, [projectId, email]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
                <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-3xl bg-[#fef7f2] animate-pulse" />
                    <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-[#d9a88a] animate-spin" />
                </div>
                <h1 className="text-3xl font-black text-[#2d3142] mb-3">Verifying Invitation</h1>
                <p className="text-gray-500 font-medium max-w-sm">
                    Please wait while we secure your access to the project...
                </p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="w-24 h-24 rounded-[32px] bg-green-50 flex items-center justify-center mb-8 shadow-sm">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-4xl font-black text-[#2d3142] mb-4 tracking-tight">
                    Welcome to <span className="text-[#d9a88a]">{projectName}</span>
                </h1>
                <p className="text-gray-500 font-medium max-w-md mx-auto mb-12 text-lg leading-relaxed">
                    The invitation has been successfully accepted. You now have exclusive access to view this project's designs and selections.
                </p>
                <Button
                    onClick={() => router.push('/')}
                    className="bg-[#d9a88a] text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-orange-100/50"
                >
                    Accepts Invitation
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 rounded-[32px] bg-red-50 flex items-center justify-center mb-8">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-[#2d3142] mb-4">Invitation Error</h1>
            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-10">
                {errorMessage}
            </p>
            <Button
                onClick={() => router.push('/')}
                className="bg-gray-100 text-gray-500 px-8 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
                Return to Home
            </Button>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Container className="py-12">
            <div className="max-w-4xl mx-auto bg-white rounded-[48px] shadow-2xl shadow-gray-100/50 border border-gray-50 overflow-hidden min-h-[70vh] flex items-center justify-center relative">
                {/* Decorative backgrounds */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#fef7f2] rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50" />

                <div className="relative z-10 w-full px-8">
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-20">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Secure Client Access</span>
                    </div>

                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center text-center">
                            <Loader2 className="w-10 h-10 text-[#d9a88a] animate-spin mb-4" />
                            <p className="text-gray-400 font-bold">Initializing...</p>
                        </div>
                    }>
                        <AcceptInviteContent />
                    </Suspense>
                </div>
            </div>
        </Container>
    );
}
