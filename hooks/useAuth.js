import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import authService from '@/services/authService';
import useAuthStore from '@/store/useAuthStore';

import { toast } from '@/components/ui/Toast';
import { useLoader } from '@/context/LoaderContext';

const setAuthState = (userData, token) => {
    if (token && typeof window !== 'undefined') {
        const user = userData.data || userData;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        useAuthStore.getState().login(user, token);
    }
};

export const clearAuthState = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_details');
    }
    useAuthStore.getState().logout();
};

export const useUser = () => {
    const isClient = typeof window !== 'undefined';
    const token = isClient ? localStorage.getItem('token') : null;

    return useQuery({
        queryKey: ['user-info'],
        queryFn: async () => {
            const userInfo = await authService.getUserInfo();
            return userInfo.data || userInfo;
        },
        enabled: !!token,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useGetUsers = ({ enabled = true, ...params } = {}) => {
    return useQuery({
        queryKey: ['users', params],
        queryFn: async () => {
            const response = await authService.getAllUsers(params);
            return response.data || response;
        },
        enabled
    });
};

export const usePlatformStats = (options = {}) => {
    return useQuery({
        queryKey: ['platform-stats'],
        queryFn: async () => {
            const response = await authService.getPlatformStats();
            return response.data || response;
        },
        ...options
    });
};

export const useAuth = () => {
    const { data: userData, isLoading: queryLoading } = useUser();
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoadingState] = useState(true);
    const router = useRouter();
    const { setLoading } = useLoader();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token) {
            setIsAuthenticated(true);
            if (userData) {
                setUser(userData);
                useAuthStore.getState().login(userData, token);
            } else if (!queryLoading) {
                if (storedUser) {
                    try {
                        const initialUser = JSON.parse(storedUser);
                        setUser(initialUser);
                        useAuthStore.getState().login(initialUser, token);
                    } catch (e) { }
                }
            }
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }

        if (!queryLoading) {
            setLoadingState(false);
        }
    }, [userData, queryLoading]);

    const logout = () => {
        setLoading(true);
        clearAuthState();
        setUser(null);
        setIsAuthenticated(false);
        router.push('/auth/login');
    };

    return { user, isAuthenticated, loading, logout };
};

export const useVerifyOtpMutation = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const flow = searchParams.get('flow');
    const { setLoading } = useLoader();

    return useMutation({
        mutationFn: (data) => authService.verifyOtp(data),
        onSuccess: async (data) => {
            const user = data.data.user;
            const token = data.data.token;

            setAuthState(user, token);

            setLoading(true);

            // Force a refresh of user info to ensure all stores are in sync
            try {
                const queryClient = useQueryClient();
                await queryClient.invalidateQueries({ queryKey: ['user-info'] });
            } catch (e) { }

            if (flow === 'reset') {
                router.push('/reset-password');
                return;
            }

            const role = user?.role;
            if (role === 'brand' || role === 'vendor' || role === 'retailer' || role === 'admin' || role === 'architect') {
                router.push('/dashboard');
            } else {
                router.push('/');
            }
        },
        onError: (error) => {
        }
    });
};

export const useRegisterMutation = () => {
    const router = useRouter();
    const { setLoading } = useLoader();

    return useMutation({
        mutationFn: (userData) => authService.register(userData),
        onSuccess: (data, variables) => {
            toast.success("Verification code sent to email.", "Account Created");
            const email = variables.email || data?.email;
            router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Registration failed";
            toast.error(message, "Registration Error");
        }
    });
};

export const useLoginMutation = () => {
    const router = useRouter();
    const { setLoading } = useLoader();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials) => authService.login(credentials),
        onSuccess: async (data, variables) => {
            const responseData = data.data || {};
            const user = responseData.user || {
                email: variables.email,
                name: variables.email.split('@')[0],
                role: responseData.role
            };

            setAuthState(user, responseData.token);
            toast.success("Successfully logged in!", "Welcome Back");

            let finalRole = user?.role;

            try {
                queryClient.invalidateQueries({ queryKey: ['user-info'] });

                const userInfo = await authService.getUserInfo();
                const userUpdate = userInfo.data || userInfo;
                finalRole = userUpdate.role || finalRole;
            } catch (error) {
            }

            if (finalRole === 'brand' || finalRole === 'vendor' || finalRole === 'retailer' || finalRole === 'admin' || finalRole === 'architect') {
                setLoading(true);
                router.push(`/dashboard`);
            } else {
                setLoading(true);
                router.push('/');
            }
        },
        onError: (error) => {
            const is401 = error.message?.includes('401') || error.response?.status === 401;
            const message = is401 ? 'Invalid email or password' : (error.message || 'Login failed');
            toast.error(message, 'Login Failed');
        }
    });
};

export const useResendOtpMutation = () => {
    return useMutation({
        mutationFn: (data) => authService.resendOtp(data),
    });
};

export const useForgotPasswordMutation = () => {
    return useMutation({
        mutationFn: (data) => authService.forgotPassword(data),
    });
};

export const useResetPasswordMutation = () => {
    const router = useRouter();
    return useMutation({
        mutationFn: (data) => authService.resetPassword(data),
        onSuccess: () => {
            clearAuthState();
            router.push('/auth/login');
        }
    });
};

export const useChangePasswordMutation = () => {
    return useMutation({
        mutationFn: (data) => authService.changePassword(data),
        onSuccess: (data, variables, context) => {
            toast.success("Your password has been updated successfully.", "Password Updated");
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error.message || "Failed to update password";
            toast.error(message, "Update Failed");
        }
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => authService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => authService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
};
