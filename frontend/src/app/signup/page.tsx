'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, Check, X,
    User, Users, Crown, Moon, Sun, Mail, Lock, ArrowRight, Target
} from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'operative'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const requirements = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    };

    const allRequirementsMet = Object.values(requirements).every(Boolean);
    const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!allRequirementsMet) {
            setError('Access code does not meet security requirements');
            return;
        }

        if (!passwordsMatch) {
            setError('Access codes do not match');
            return;
        }

        if (!isEmailValid) {
            setError('Invalid comm channel (email) format');
            return;
        }

        setLoading(true);
        try {
            await authApi.register(formData.username, formData.password, formData.email, formData.role);
            router.push('/?registered=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Clearance request denied');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { id: 'operative', label: 'Operative', desc: 'Field Agent', icon: User, gradient: 'from-blue-600 to-blue-800' },
        { id: 'co', label: 'CO', desc: 'Commander', icon: Users, gradient: 'from-amber-600 to-amber-800' },
    ];

    const selectedRole = roles.find(r => r.id === formData.role);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            {/* Tactical Grid Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
            </div>

            {/* Theme Toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="fixed top-6 right-6 text-slate-400 hover:text-white z-50"
            >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 mb-6 shadow-2xl shadow-emerald-500/20 border border-emerald-500/30">
                        <ShieldCheck className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-wider uppercase text-white">
                        Request <span className="text-emerald-400">Clearance</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-mono text-sm tracking-wide">REGISTER NEW OPERATIVE</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-mono">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Signup Card */}
                <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Role Selection */}
                            <div className="space-y-3">
                                <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Designation</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {roles.map((role) => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: role.id })}
                                            className={`p-4 rounded-xl text-center transition-all border ${formData.role === role.id
                                                    ? `bg-gradient-to-br ${role.gradient} shadow-lg border-white/20`
                                                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            <role.icon className={`h-6 w-6 mx-auto mb-2 ${formData.role === role.id ? 'text-white' : 'text-slate-400'
                                                }`} />
                                            <div className={`text-sm font-bold uppercase tracking-wider ${formData.role === role.id ? 'text-white' : 'text-slate-400'
                                                }`}>
                                                {role.label}
                                            </div>
                                            <div className={`text-xs font-mono ${formData.role === role.id ? 'text-white/70' : 'text-slate-500'
                                                }`}>
                                                {role.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Callsign */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Callsign</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="text"
                                        placeholder="Choose callsign"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Comm Channel (Email) */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Comm Channel</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="email"
                                        placeholder="secure@channel.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Access Code (Password) */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Access Code</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create access code"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="pl-10 pr-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 font-mono"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-12 px-3 text-slate-400 hover:text-white"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Security Requirements */}
                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                                <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Security Protocol</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { key: 'length', label: '8+ chars' },
                                        { key: 'uppercase', label: 'Uppercase' },
                                        { key: 'lowercase', label: 'Lowercase' },
                                        { key: 'special', label: 'Special' },
                                    ].map((req) => (
                                        <div key={req.key} className={`flex items-center gap-2 text-xs font-mono ${requirements[req.key as keyof typeof requirements] ? 'text-emerald-400' : 'text-slate-600'
                                            }`}>
                                            {requirements[req.key as keyof typeof requirements] ? (
                                                <Check className="h-3 w-3" />
                                            ) : (
                                                <X className="h-3 w-3" />
                                            )}
                                            {req.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Confirm Access Code */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Confirm Code</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="password"
                                        placeholder="Confirm access code"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 font-mono"
                                        required
                                    />
                                    {formData.confirmPassword && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {passwordsMatch ? (
                                                <Check className="h-4 w-4 text-emerald-400" />
                                            ) : (
                                                <X className="h-4 w-4 text-red-400" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={loading || !allRequirementsMet || !passwordsMatch || !isEmailValid}
                                className={`w-full h-12 text-lg font-bold tracking-wider uppercase shadow-lg bg-gradient-to-r ${selectedRole?.gradient || 'from-emerald-600 to-emerald-700'} hover:opacity-90 border border-white/10`}
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Request Clearance
                                        <ArrowRight className="h-5 w-5 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-slate-500 mt-6 font-mono text-sm">
                    Already authorized?{' '}
                    <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-bold">
                        Authenticate
                    </Link>
                </p>

                {/* Security Badge */}
                <div className="mt-8 flex items-center justify-center gap-2 text-slate-600 text-xs font-mono uppercase tracking-wider">
                    <Target className="h-3 w-3" />
                    <span>All data encrypted at rest</span>
                </div>
            </div>
        </div>
    );
}
