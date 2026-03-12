'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { startAuthentication } from '@simplewebauthn/browser';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, Check, Fingerprint,
  Moon, Sun, Lock, User, KeyRound, ArrowRight, Radio, Target
} from 'lucide-react';

type LoginStep = 'credentials' | 'otp' | 'passkey';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const [step, setStep] = useState<LoginStep>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [hasPasskey, setHasPasskey] = useState(false);

  const isRegistered = searchParams.get('registered') === 'true';

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (username.length > 2) {
      checkPasskey();
    }
  }, [username]);

  const checkPasskey = async () => {
    try {
      const res = await authApi.webauthn.check(username);
      setHasPasskey(res.has_passkey);
    } catch {
      setHasPasskey(false);
    }
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.login(username, password);
      setStep('otp');
      setCountdown(120);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
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
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }

    if (newOtp.every(d => d) && value) {
      verifyOtp(newOtp.join(''));
    }
  };

  const verifyOtp = async (otpCode: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await authApi.verifyOtp(username, otpCode);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      redirectByRole(res.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid clearance code');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const options = await authApi.webauthn.loginOptions(username);
      const assertion = await startAuthentication(options);
      const res = await authApi.webauthn.loginVerify(username, assertion);

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      redirectByRole(res.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role: string) => {
    switch (role) {
      case 'operative': router.push('/operative/vault'); break;
      case 'co': router.push('/co/dashboard'); break;
      case 'hq': router.push('/hq/dashboard'); break;
      default: router.push('/');
    }
  };

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
            Iron<span className="text-emerald-400">Vault</span>
          </h1>
          <p className="text-slate-500 mt-2 font-mono text-sm tracking-wide">TACTICAL CREDENTIALS SYSTEM</p>
        </div>

        {/* Success Alert */}
        {isRegistered && step === 'credentials' && (
          <Alert className="mb-6 bg-emerald-500/10 border-emerald-500/30">
            <Check className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-400 font-mono">
              CLEARANCE GRANTED. Enter credentials.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-mono">{error}</AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-8">
            {step === 'credentials' && (
              <form onSubmit={handleCredentialSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Callsign</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Enter callsign"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 font-mono text-xs uppercase tracking-wider">Access Code</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter access code"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-bold tracking-wider uppercase bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg shadow-emerald-500/20 border border-emerald-500/30"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Authenticate
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>

                {/* Passkey Login */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-500 font-mono">or</span>
                  </div>
                </div>

                {hasPasskey ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-mono uppercase tracking-wider"
                    onClick={handlePasskeyLogin}
                    disabled={loading || !username}
                  >
                    <Fingerprint className="h-5 w-5 mr-2" />
                    Biometric Access
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 border-slate-700 text-slate-500 cursor-not-allowed opacity-60 font-mono uppercase"
                      disabled
                    >
                      <Fingerprint className="h-5 w-5 mr-2" />
                      Biometric Access
                    </Button>
                    <p className="text-xs text-center text-slate-600 font-mono">
                      Register biometrics in Profile after login
                    </p>
                  </div>
                )}
              </form>
            )}

            {step === 'otp' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                    <Radio className="h-8 w-8 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">Verification Required</h2>
                  <p className="text-slate-400 text-sm mt-2 font-mono">
                    Enter 6-digit clearance code
                  </p>
                  {countdown > 0 && (
                    <p className="text-emerald-400 text-sm mt-2 font-mono">
                      CODE EXPIRES: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                    </p>
                  )}
                </div>

                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-14 text-center text-xl font-bold bg-slate-800/50 border-slate-600 text-white focus:border-emerald-500 font-mono"
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
                  className="w-full text-slate-400 hover:text-white font-mono uppercase tracking-wider"
                  onClick={() => {
                    setStep('credentials');
                    setOtp(['', '', '', '', '', '']);
                  }}
                >
                  Abort Authentication
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-slate-500 font-mono text-sm">
            New operative?{' '}
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-bold">
              Request Clearance
            </Link>
          </p>
          <p className="text-slate-500 font-mono text-sm">
            Access code compromised?{' '}
            <Link href="/reset-password" className="text-amber-400 hover:text-amber-300 font-bold">
              Reset Credentials
            </Link>
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-600 text-xs font-mono uppercase tracking-wider">
          <Target className="h-3 w-3" />
          <span>AES-256 Encrypted • MFA Secured</span>
        </div>
      </div>
    </div>
  );
}
