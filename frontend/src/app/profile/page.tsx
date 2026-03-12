'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, profileApi } from '@/lib/api';
import { startRegistration } from '@simplewebauthn/browser';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Shield, User, Mail, Lock, Fingerprint, Check, AlertCircle, Trash2,
    Moon, Sun, LogOut, Loader2, Eye, EyeOff, Crown, Users, ChevronRight, 
    Key, Calendar, ArrowLeft, ShieldCheck
} from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showPasswords, setShowPasswords] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        
        // Fetch full user details including email
        fetchUserDetails();
        checkPasskey();
    }, [router]);

    const fetchUserDetails = async () => {
        try {
            const res = await authApi.me();
            if (res.user) {
                setUserEmail(res.user.email || '');
                // Update localStorage with email
                const stored = localStorage.getItem('user');
                if (stored) {
                    const u = JSON.parse(stored);
                    u.email = res.user.email;
                    localStorage.setItem('user', JSON.stringify(u));
                }
            }
        } catch (err) {
            console.error('Failed to fetch user details:', err);
        }
    };

    const checkPasskey = async () => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const u = JSON.parse(stored);
                const res = await authApi.checkPasskeyExists(u.username);
                setHasPasskey(res.has_passkey);
            }
        } catch {
            setHasPasskey(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwords.new.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        setLoading(true);
        try {
            await profileApi.changePassword(passwords.current, passwords.new);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswords({ current: '', new: '', confirm: '' });
            setShowPasswordChange(false);
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterPasskey = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const options = await authApi.getPasskeyRegisterOptions();
            const attestation = await startRegistration(options);
            await authApi.verifyPasskeyRegistration(attestation);
            setHasPasskey(true);
            setMessage({ type: 'success', text: 'Passkey registered successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to register passkey' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const handleDeleteAccount = async () => {
        // In a real app, this would call an API to delete the account
        setMessage({ type: 'error', text: 'Account deletion is disabled in demo mode.' });
        setShowDeleteConfirm(false);
    };

    const getRoleBadgeClass = () => {
        switch (user?.role) {
            case 'hq': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'co': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    const getRoleColor = () => {
        switch (user?.role) {
            case 'hq': return 'text-red-400';
            case 'co': return 'text-amber-400';
            default: return 'text-blue-400';
        }
    };

    const getRoleIcon = () => {
        switch (user?.role) {
            case 'hq': return Crown;
            case 'co': return Users;
            default: return User;
        }
    };

    const getRoleTitle = () => {
        switch (user?.role) {
            case 'hq': return 'Central Command';
            case 'co': return 'Commanding Officer';
            default: return 'Field Operative';
        }
    };

    const getDashboardLink = () => {
        switch (user?.role) {
            case 'operative': return '/operative/vault';
            case 'co': return '/co/dashboard';
            case 'hq': return '/hq/dashboard';
            default: return '/';
        }
    };

    const RoleIcon = getRoleIcon();

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-wider uppercase text-foreground">
                                Iron<span className="text-emerald-500">Vault</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-red-400">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Back Button */}
                <Link href={getDashboardLink()}>
                    <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground font-mono uppercase tracking-wider">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>

                {/* Alerts */}
                {message && (
                    <Alert className={`mb-6 ${message.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                        }`}>
                        {message.type === 'success' ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                        <AlertDescription className={message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Profile Header */}
                <Card className="bg-card border-border mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                            <div className={`w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center border border-border`}>
                                <RoleIcon className={`h-10 w-10 ${getRoleColor()}`} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-foreground uppercase tracking-wider">{user.username}</h1>
                                <p className="text-muted-foreground font-mono text-sm">{getRoleTitle()}</p>
                                <Badge className={`mt-2 ${getRoleBadgeClass()}`}>
                                    {user.role?.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 mt-6">
                            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Email</div>
                                        <div className="text-foreground">{userEmail || user.email || 'Loading...'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Member Since</div>
                                        <div className="text-foreground">{new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Section */}
                <Card className="bg-card border-border mb-6">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                            <Key className="h-5 w-5 text-amber-500" />
                            Security Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Password Change */}
                        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <Lock className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground">Password</div>
                                        <div className="text-sm text-muted-foreground">Change your account password</div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                                    className="border-border text-foreground hover:bg-secondary"
                                >
                                    Change
                                    <ChevronRight className={`h-4 w-4 ml-2 transition-transform ${showPasswordChange ? 'rotate-90' : ''}`} />
                                </Button>
                            </div>

                            {showPasswordChange && (
                                <form onSubmit={handlePasswordChange} className="mt-4 pt-4 border-t border-border space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                type={showPasswords ? 'text' : 'password'}
                                                value={passwords.current}
                                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                className="bg-secondary/50 border-border text-foreground pr-10"
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 text-muted-foreground"
                                                onClick={() => setShowPasswords(!showPasswords)}
                                            >
                                                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">New Password</Label>
                                            <Input
                                                type={showPasswords ? 'text' : 'password'}
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                className="bg-secondary/50 border-border text-foreground"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Confirm Password</Label>
                                            <Input
                                                type={showPasswords ? 'text' : 'password'}
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                className="bg-secondary/50 border-border text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={loading} className="bg-purple-500 hover:bg-purple-600 text-white font-mono uppercase tracking-wider">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
                                    </Button>
                                </form>
                            )}
                        </div>

                        {/* Passkey Registration */}
                        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <Fingerprint className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground">Passkey (WebAuthn)</div>
                                        <div className="text-sm text-muted-foreground">
                                            {hasPasskey ? 'Passkey is registered' : 'Use biometrics for passwordless login'}
                                        </div>
                                    </div>
                                </div>
                                {hasPasskey ? (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                        <Check className="h-3 w-3 mr-1" />
                                        Active
                                    </Badge>
                                ) : (
                                    <Button
                                        onClick={handleRegisterPasskey}
                                        disabled={loading}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-mono uppercase tracking-wider"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register'}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* MFA Status */}
                        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground">Two-Factor Authentication</div>
                                        <div className="text-sm text-muted-foreground">OTP verification on every login</div>
                                    </div>
                                </div>
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                    <Check className="h-3 w-3 mr-1" />
                                    Enabled
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Actions */}
                <Card className="bg-card border-border mb-6">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                            <User className="h-5 w-5 text-blue-500" />
                            Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="w-full border-border text-foreground hover:bg-secondary font-mono uppercase tracking-wider"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-card border-red-500/30">
                    <CardHeader>
                        <CardTitle className="text-red-400 flex items-center gap-2 font-mono uppercase tracking-wider">
                            <AlertCircle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                            Once you delete your account, there is no going back. All your data will be permanently removed.
                        </p>
                        
                        {!showDeleteConfirm ? (
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono uppercase tracking-wider"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Account
                            </Button>
                        ) : (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-4">
                                <p className="text-red-400 text-sm font-mono">Are you sure? This action cannot be undone.</p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 border-border text-foreground hover:bg-secondary"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleDeleteAccount}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-mono uppercase"
                                    >
                                        Delete Forever
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
