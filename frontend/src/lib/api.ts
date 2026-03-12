/**
 * IronVault API Client
 * Handles all API calls to the backend
 */

const API_BASE_URL = 'http://localhost:5000';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// User type
export interface User {
    user_id: number;
    username: string;
    role: 'operative' | 'co' | 'hq';
    team_name?: string;
}

// Mission type (formerly Contract)
export interface Mission {
    id: number;
    operative_name: string;
    unit_name: string;
    salary: string;
    duration_years: number;
    mission_type: string;
    created_at: string;
}

// Intel type (formerly Strategy)
export interface Intel {
    id: number;
    title: string;
    description: string;
    intel_type: string;
    content: string;
    uploaded_by: number;
    created_at: string;
}

// Operation type (formerly Bid)
export interface Operation {
    id: number;
    operative_name: string;
    budget_amount: number;
    status: string;
    has_signature: boolean;
    created_at: string;
}

// Credential type
export interface Credential {
    id: number;
    target_system: string;
    callsign: string;
    access_code: string;
    notes?: string;
    created_at: string;
}

// =============================================================================
// AUTH API
// =============================================================================
export const authApi = {
    register: async (username: string, password: string, email: string, role: string = 'operative') => {
        return fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, email, role }),
        });
    },

    login: async (username: string, password: string) => {
        return fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    verifyOtp: async (username: string, otp: string) => {
        return fetchWithAuth('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ username, otp }),
        });
    },

    me: async () => {
        return fetchWithAuth('/auth/me');
    },

    // Password reset methods
    requestPasswordReset: async (email: string) => {
        return fetchWithAuth('/auth/request-password-reset', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    verifyResetOtp: async (email: string, otp: string) => {
        return fetchWithAuth('/auth/verify-reset-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        });
    },

    resetPassword: async (email: string, otp: string, newPassword: string) => {
        return fetchWithAuth('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, otp, new_password: newPassword }),
        });
    },

    // WebAuthn Passkey methods
    getPasskeyRegisterOptions: async () => {
        return fetchWithAuth('/auth/webauthn/register/options', { method: 'POST' });
    },

    verifyPasskeyRegistration: async (credential: object) => {
        return fetchWithAuth('/auth/webauthn/register/verify', {
            method: 'POST',
            body: JSON.stringify(credential),
        });
    },

    getPasskeyLoginOptions: async (username: string) => {
        return fetchWithAuth('/auth/webauthn/login/options', {
            method: 'POST',
            body: JSON.stringify({ username }),
        });
    },

    verifyPasskeyLogin: async (username: string, credential: object) => {
        return fetchWithAuth('/auth/webauthn/login/verify', {
            method: 'POST',
            body: JSON.stringify({ username, credential }),
        });
    },

    checkPasskeyExists: async (username: string) => {
        return fetchWithAuth('/auth/webauthn/check', {
            method: 'POST',
            body: JSON.stringify({ username }),
        });
    },

    // Alias object for login page compatibility
    webauthn: {
        check: async (username: string) => {
            return fetchWithAuth('/auth/webauthn/check', {
                method: 'POST',
                body: JSON.stringify({ username }),
            });
        },
        loginOptions: async (username: string) => {
            return fetchWithAuth('/auth/webauthn/login/options', {
                method: 'POST',
                body: JSON.stringify({ username }),
            });
        },
        loginVerify: async (username: string, credential: object) => {
            return fetchWithAuth('/auth/webauthn/login/verify', {
                method: 'POST',
                body: JSON.stringify({ username, ...credential }),
            });
        },
    },
};

// =============================================================================
// MISSIONS API (Operative Assignments)
// =============================================================================
export const missionsApi = {
    getAll: async () => {
        return fetchWithAuth('/missions');
    },

    create: async (data: {
        operative_name: string;
        unit_name: string;
        salary: string;
        duration_years?: number;
        mission_type?: string;
    }) => {
        return fetchWithAuth('/missions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    get: async (id: number) => {
        return fetchWithAuth(`/missions/${id}`);
    },

    verify: async (id: number) => {
        return fetchWithAuth(`/missions/${id}/verify`);
    },

    delete: async (id: number) => {
        return fetchWithAuth(`/missions/${id}`, { method: 'DELETE' });
    },
};

// =============================================================================
// CREDENTIALS API (Operative Vault)
// =============================================================================
export const credentialsApi = {
    getAll: async () => {
        return fetchWithAuth('/credentials');
    },

    get: async (id: number) => {
        return fetchWithAuth(`/credentials/${id}`);
    },

    create: async (data: {
        target_system: string;
        callsign: string;
        access_code: string;
        notes?: string;
    }) => {
        return fetchWithAuth('/credentials', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: number, data: {
        target_system?: string;
        callsign?: string;
        access_code?: string;
        notes?: string;
    }) => {
        return fetchWithAuth(`/credentials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: number) => {
        return fetchWithAuth(`/credentials/${id}`, { method: 'DELETE' });
    },
};

// =============================================================================
// INTEL API (CO Reports)
// =============================================================================
export const intelApi = {
    getAll: async () => {
        return fetchWithAuth('/intel');
    },

    create: async (data: {
        title: string;
        description?: string;
        intel_type?: string;
        content: string;
    }) => {
        return fetchWithAuth('/intel', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: number) => {
        return fetchWithAuth(`/intel/${id}`, { method: 'DELETE' });
    },

    // Operations
    createOperation: async (data: { operative_name: string; budget_amount: number }) => {
        return fetchWithAuth('/intel/operation', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getOperations: async () => {
        return fetchWithAuth('/intel/operations');
    },

    verifyOperation: async (id: number) => {
        return fetchWithAuth(`/intel/verify-operation/${id}`);
    },

    tamperOperation: async (id: number) => {
        return fetchWithAuth(`/intel/tamper-operation/${id}`, { method: 'POST' });
    },
};

// =============================================================================
// DOCUMENTS API (Encrypted PDFs)
// =============================================================================
export const documentsApi = {
    upload: async (file: File, title: string, description?: string, classification?: string) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        if (description) formData.append('description', description);
        if (classification) formData.append('classification', classification);

        const response = await fetch(`${API_BASE_URL}/documents/upload`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }
        return data;
    },

    getAll: async () => {
        return fetchWithAuth('/documents');
    },

    get: async (id: number) => {
        return fetchWithAuth(`/documents/${id}`);
    },

    verify: async (id: number) => {
        return fetchWithAuth(`/documents/${id}/verify`);
    },

    tamper: async (id: number) => {
        return fetchWithAuth(`/documents/${id}/tamper`, { method: 'POST' });
    },

    reset: async (id: number) => {
        return fetchWithAuth(`/documents/${id}/reset`, { method: 'POST' });
    },

    delete: async (id: number) => {
        return fetchWithAuth(`/documents/${id}`, { method: 'DELETE' });
    },

    getDownloadUrl: (id: number) => {
        return `${API_BASE_URL}/documents/${id}/download`;
    },
};

// =============================================================================
// ADMIN API (HQ Command)
// =============================================================================
export const adminApi = {
    getPersonnel: async () => {
        return fetchWithAuth('/admin/personnel');
    },

    // Alias for users
    getUsers: async () => {
        return fetchWithAuth('/admin/users');
    },

    getAuditLogs: async () => {
        return fetchWithAuth('/admin/audit-logs');
    },

    getOperations: async () => {
        return fetchWithAuth('/admin/operations');
    },

    getAcm: async () => {
        return fetchWithAuth('/admin/acm');
    },

    getStats: async () => {
        return fetchWithAuth('/admin/stats');
    },
};

// =============================================================================
// PROFILE API (User Profile Management)
// =============================================================================
export const profileApi = {
    changePassword: async (currentPassword: string, newPassword: string) => {
        return fetchWithAuth('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
    },

    getProfile: async () => {
        return fetchWithAuth('/auth/me');
    },
};
