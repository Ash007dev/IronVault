'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { credentialsApi } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    ShieldCheck, ArrowLeft, Key, Target, User, Lock, FileText,
    Moon, Sun, LogOut, Loader2, Sparkles, RefreshCw, Copy, Check, Eye, EyeOff, AlertTriangle
} from 'lucide-react';

export default function AddCredentialPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [existingPasswords, setExistingPasswords] = useState<string[]>([]);
    const [duplicateWarning, setDuplicateWarning] = useState(false);
    const [formData, setFormData] = useState({
        target_system: '',
        callsign: '',
        access_code: '',
        notes: ''
    });

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const u = JSON.parse(stored);
        if (u.role !== 'operative') {
            router.push('/');
            return;
        }
        setUser(u);
        loadExistingPasswords();
    }, [router]);

    const loadExistingPasswords = async () => {
        try {
            const data = await credentialsApi.getAll();
            const passwords = (data.credentials || []).map((c: any) => c.access_code);
            setExistingPasswords(passwords);
        } catch (err) {
            console.error('Failed to load existing credentials:', err);
        }
    };

    const checkDuplicate = (password: string) => {
        const isDuplicate = existingPasswords.includes(password);
        setDuplicateWarning(isDuplicate);
        return isDuplicate;
    };

    const generateCipher = () => {
        // Generate a cryptographically strong password using Web Crypto API
        // Algorithm: Uses crypto.getRandomValues() for CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)
        const length = 24;
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let password = '';
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loop
        
        do {
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);

            password = '';
            for (let i = 0; i < length; i++) {
                password += charset[array[i] % charset.length];
            }

            // Ensure at least one of each character type for complexity
            const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lower = 'abcdefghijklmnopqrstuvwxyz';
            const numbers = '0123456789';
            const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

            const chars = password.split('');
            // Use crypto.getRandomValues for position selection too
            const positions = new Uint8Array(4);
            crypto.getRandomValues(positions);
            
            chars[positions[0] % length] = upper[positions[0] % upper.length];
            chars[positions[1] % length] = lower[positions[1] % lower.length];
            chars[positions[2] % length] = numbers[positions[2] % numbers.length];
            chars[positions[3] % length] = special[positions[3] % special.length];

            // Fisher-Yates shuffle using crypto random
            const shuffleArray = new Uint8Array(length);
            crypto.getRandomValues(shuffleArray);
            for (let i = chars.length - 1; i > 0; i--) {
                const j = shuffleArray[i] % (i + 1);
                [chars[i], chars[j]] = [chars[j], chars[i]];
            }

            password = chars.join('');
            attempts++;
        } while (existingPasswords.includes(password) && attempts < maxAttempts);

        setFormData({ ...formData, access_code: password });
        setDuplicateWarning(false);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(formData.access_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Check for duplicate before submitting
        if (checkDuplicate(formData.access_code)) {
            return; // Don't submit if duplicate
        }
        
        setLoading(true);

        try {
            await credentialsApi.create(formData);
            router.push('/operative/vault');
        } catch (err) {
            console.error('Failed to create credential:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-wider uppercase text-white">
                                Iron<span className="text-emerald-400">Vault</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-white">
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-6 py-8">
                {/* Back Button */}
                <Link href="/operative/vault">
                    <Button variant="ghost" className="mb-6 text-slate-400 hover:text-white font-mono uppercase tracking-wider">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Vault
                    </Button>
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                        <Key className="h-8 w-8 text-emerald-400" />
                        Add Intel
                    </h1>
                    <p className="text-slate-500 font-mono mt-1">Store new credential in vault</p>
                </div>

                {/* Form Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Target System */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                                    <Target className="h-4 w-4 text-emerald-400" />
                                    Target System
                                </Label>
                                <Input
                                    placeholder="e.g., Drone Control Link, Bunker 4 Access"
                                    value={formData.target_system}
                                    onChange={(e) => setFormData({ ...formData, target_system: e.target.value })}
                                    className="bg-slate-800/50 border-slate-700 text-white font-mono"
                                    required
                                />
                            </div>

                            {/* Callsign/ID */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-400" />
                                    Callsign / ID
                                </Label>
                                <Input
                                    placeholder="Username or identifier"
                                    value={formData.callsign}
                                    onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                                    className="bg-slate-800/50 border-slate-700 text-white font-mono"
                                    required
                                />
                            </div>

                            {/* Access Code */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-amber-400" />
                                    Access Code
                                </Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter or generate access code"
                                            value={formData.access_code}
                                            onChange={(e) => {
                                                setFormData({ ...formData, access_code: e.target.value });
                                                checkDuplicate(e.target.value);
                                            }}
                                            className="bg-slate-800/50 border-slate-700 text-white font-mono pr-10"
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-mono"
                                        onClick={generateCipher}
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate
                                    </Button>
                                </div>

                                {/* Duplicate Warning */}
                                {duplicateWarning && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                        <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                        <p className="text-sm text-red-400 font-mono">
                                            This access code already exists! Please use a unique password.
                                        </p>
                                    </div>
                                )}

                                {/* Generated Code Display */}
                                {formData.access_code && !duplicateWarning && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 bg-slate-800/50 rounded-lg p-3 border border-emerald-500/30">
                                            <code className="font-mono text-sm text-emerald-400 break-all">
                                                {showPassword ? formData.access_code : '•'.repeat(formData.access_code.length)}
                                            </code>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className={`h-8 w-8 ${copied ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400'}`}
                                                onClick={handleCopy}
                                            >
                                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 border-slate-700 text-slate-400"
                                                onClick={generateCipher}
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Algorithm Info */}
                                <p className="text-xs text-slate-500 font-mono">
                                    Algorithm: Web Crypto CSPRNG • 24 chars • Upper/Lower/Numbers/Symbols
                                </p>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                    Notes (Optional)
                                </Label>
                                <Textarea
                                    placeholder="Additional intel..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="bg-slate-800/50 border-slate-700 text-white font-mono resize-none"
                                    rows={3}
                                />
                            </div>

                            {/* Security Notice */}
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-400">Encrypted Storage</p>
                                        <p className="text-xs text-emerald-400/70">All credentials are encrypted with AES-256-CBC before storage</p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3">
                                <Link href="/operative/vault" className="flex-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full border-slate-700 text-slate-400 font-mono uppercase"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 font-mono uppercase tracking-wider"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Lock className="h-4 w-4 mr-2" />
                                            Store Intel
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
