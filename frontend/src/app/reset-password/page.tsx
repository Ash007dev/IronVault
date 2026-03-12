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
    ShieldCheck, ArrowLeft, KeyRound, Moon, Sun, Loader2, AlertCircle, Check, Mail, Lock, Target
} from 'lucide-react';

export default function ResetPasswordPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await authApi.requestPasswordReset(email);
            setStep('verify');
            setMaskedEmail(res.message || `Reset code sent to ${email.substring(0, 3)}***`);
            setSuccess('Verification code sent! Check your email or backend console.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            const next = document.getElementById(`reset-otp-${index + 1}`);
            next?.focus();
        }

        if (newOtp.every(d => d) && value) {
            handleVerifyOtp(newOtp.join(''));
        }
    };

    const handleVerifyOtp = async (otpCode: string) => {
        setError('');
        setLoading(true);

        try {
            await authApi.verifyResetOtp(email, otpCode);
            setStep('reset');
            setSuccess('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid verification code');
            setOtp(['', '', '', '', '', '']);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Access codes do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Access code must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            await authApi.resetPassword(email, otp.join(''), newPassword);
            setSuccess('Access code reset successful! Redirecting...');
            setTimeout(() => router.push('/'), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset access code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors">
            {/* Tactical Grid Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 dark:opacity-5" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
            </div>

            {/* Theme Toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="fixed top-6 right-6 text-muted-foreground hover:text-foreground z-50"
            >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-800 mb-6 shadow-2xl shadow-amber-500/20 border border-amber-500/30">
                        <KeyRound className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-wider uppercase text-foreground">
                        Credential <span className="text-amber-500">Recovery</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 font-mono text-sm tracking-wide">IRONVAULT SECURITY PROTOCOL</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-mono">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Success Alert */}
                {success && (
                    <Alert className="mb-6 bg-emerald-500/10 border-emerald-500/30">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <AlertDescription className="text-emerald-500 font-mono">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Main Card */}
                <Card className="bg-card border-border backdrop-blur-xl shadow-2xl">
                    <CardContent className="p-8">
                        {step === 'email' && (
                            <form onSubmit={handleRequestReset} className="space-y-6">
                                <div className="text-center mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
                                        <Mail className="h-7 w-7 text-amber-500" />
                                    </div>
                                    <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">Enter Comm Channel</h2>
                                    <p className="text-muted-foreground text-sm mt-1 font-mono">Verification code will be transmitted</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Comm Channel (Email)</Label>
                                    <Input
                                        type="email"
                                        placeholder="operative@ironvault.mil"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 font-mono"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-bold tracking-wider uppercase bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-amber-500/20 border border-amber-500/30 text-white"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Initiate Recovery'}
                                </Button>
                            </form>
                        )}

                        {step === 'verify' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                                        <ShieldCheck className="h-7 w-7 text-emerald-500" />
                                    </div>
                                    <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">Verification Required</h2>
                                    <p className="text-muted-foreground text-sm mt-1 font-mono">Enter 6-digit security code</p>
                                </div>

                                <div className="flex justify-center gap-2">
                                    {otp.map((digit, index) => (
                                        <Input
                                            key={index}
                                            id={`reset-otp-${index}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            className="w-12 h-14 text-center text-xl font-bold bg-secondary/50 border-border text-foreground focus:border-emerald-500 font-mono"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>

                                {loading && (
                                    <div className="flex justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                    </div>
                                )}

                                <Button
                                    variant="ghost"
                                    className="w-full text-muted-foreground hover:text-foreground font-mono uppercase tracking-wider"
                                    onClick={() => {
                                        setStep('email');
                                        setOtp(['', '', '', '', '', '']);
                                        setSuccess('');
                                    }}
                                >
                                    Abort Recovery
                                </Button>
                            </div>
                        )}

                        {step === 'reset' && (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div className="text-center mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                                        <Lock className="h-7 w-7 text-emerald-500" />
                                    </div>
                                    <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">Set New Access Code</h2>
                                    <p className="text-muted-foreground text-sm mt-1 font-mono">Create secure credentials</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">New Access Code</Label>
                                        <Input
                                            type="password"
                                            placeholder="Enter new access code"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 font-mono"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Confirm Access Code</Label>
                                        <Input
                                            type="password"
                                            placeholder="Confirm new access code"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-bold tracking-wider uppercase bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg shadow-emerald-500/20 border border-emerald-500/30 text-white"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset Access Code'}
                                </Button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <Link href="/" className="text-amber-500 hover:text-amber-400 text-sm font-mono flex items-center justify-center gap-1">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Authentication
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Badge */}
                <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-wider">
                    <Target className="h-3 w-3" />
                    <span>AES-256 Encrypted • Secure Recovery</span>
                </div>
            </div>
        </div>
    );
}
