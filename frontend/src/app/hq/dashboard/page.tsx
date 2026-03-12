'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, intelApi } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ShieldCheck, Users, FileText, Radio, Target, Moon, Sun, LogOut,
    Shield, Activity, Eye, Clock, AlertTriangle, Loader2, Crown,
    Lock, Server, Database, History, Rocket, CheckCircle, XCircle,
    AlertCircle, ShieldAlert
} from 'lucide-react';

export default function HQDashboard() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({ users: 0, logs: 0 });
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [operations, setOperations] = useState<any[]>([]);
    const [verificationResults, setVerificationResults] = useState<{[key: number]: { valid: boolean; message: string } | null}>({});
    const [verifying, setVerifying] = useState<{[key: number]: boolean}>({});
    const [tampering, setTampering] = useState<{[key: number]: boolean}>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const u = JSON.parse(stored);
        if (u.role !== 'hq') {
            router.push('/');
            return;
        }
        setUser(u);
        loadData();
    }, [router]);

    const loadData = async () => {
        try {
            const [usersData, logsData, opsData] = await Promise.all([
                adminApi.getUsers(),
                adminApi.getAuditLogs(),
                intelApi.getOperations()
            ]);
            setStats({
                users: usersData.users?.length || 0,
                logs: logsData.logs?.length || 0
            });
            setRecentLogs(logsData.logs?.slice(0, 5) || []);
            setOperations(opsData.operations || []);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOperation = async (opId: number) => {
        setVerifying(v => ({ ...v, [opId]: true }));
        try {
            const result = await intelApi.verifyOperation(opId);
            setVerificationResults(r => ({
                ...r,
                [opId]: {
                    valid: result.signature_valid,
                    message: result.message
                }
            }));
        } catch (err) {
            setVerificationResults(r => ({
                ...r,
                [opId]: {
                    valid: false,
                    message: 'Verification failed - possible tampering detected!'
                }
            }));
        } finally {
            setVerifying(v => ({ ...v, [opId]: false }));
        }
    };

    const handleTamperOperation = async (opId: number) => {
        setTampering(t => ({ ...t, [opId]: true }));
        setVerificationResults(r => ({ ...r, [opId]: null })); // Clear previous result
        try {
            await intelApi.tamperOperation(opId);
            // Reload operations to show updated budget
            const opsData = await intelApi.getOperations();
            setOperations(opsData.operations || []);
        } catch (err) {
            console.error('Tamper failed:', err);
        } finally {
            setTampering(t => ({ ...t, [opId]: false }));
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const getEventIcon = (action: string) => {
        if (action.includes('LOGIN')) return <Shield className="h-4 w-4 text-emerald-400" />;
        if (action.includes('FAIL')) return <AlertTriangle className="h-4 w-4 text-red-400" />;
        if (action.includes('CREATE')) return <FileText className="h-4 w-4 text-blue-400" />;
        return <Activity className="h-4 w-4 text-slate-400" />;
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

                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/hq/dashboard" className="text-red-400 font-mono text-sm uppercase tracking-wider">
                                HQ
                            </Link>
                            <Link href="/hq/personnel" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Personnel
                            </Link>
                            <Link href="/hq/documents" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Documents
                            </Link>
                            <Link href="/hq/warroom" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                War Room
                            </Link>
                            <Link href="/profile" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Profile
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-white">
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
                                <Crown className="h-4 w-4 text-red-400" />
                                <span className="text-sm font-mono text-red-400">COMMAND</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                        <Crown className="h-8 w-8 text-red-400" />
                        Central Command
                    </h1>
                    <p className="text-slate-500 font-mono mt-1">Full situational awareness and oversight</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.users}</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Personnel</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <History className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.logs}</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Audit Events</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">SECURE</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Status</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <Lock className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">AES-256</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Encryption</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Link href="/hq/personnel">
                        <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-500/30 transition-colors cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <Users className="h-7 w-7 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">Personnel Roster</h3>
                                        <p className="text-sm font-mono text-slate-500">Manage all operatives and officers</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/hq/warroom">
                        <Card className="bg-slate-900/50 border-slate-800 hover:border-amber-500/30 transition-colors cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <History className="h-7 w-7 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">War Room</h3>
                                        <p className="text-sm font-mono text-slate-500">Complete audit trail (Black Box)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Recent Activity */}
                <Card className="bg-slate-900/50 border-slate-800 mb-6">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <Activity className="h-5 w-5 text-emerald-400" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                            </div>
                        ) : recentLogs.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 font-mono">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentLogs.map((log: any, index: number) => (
                                    <div key={index} className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                            {getEventIcon(log.action)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-mono text-white">{log.action}</p>
                                            <p className="text-xs text-slate-500">{log.username} • {log.ip_address}</p>
                                        </div>
                                        <span className="text-xs font-mono text-slate-600">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Access Control Matrix */}
                <Card className="bg-slate-900/50 border-slate-800 mb-6">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-400" />
                            Access Control Matrix (RBAC)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="mb-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                            <p className="text-sm text-blue-400 font-mono">
                                Role-Based Access Control (RBAC) enforces strict privilege separation across all system resources.
                            </p>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left p-3 text-white font-mono uppercase text-sm">Permission</th>
                                        <th className="text-center p-3 text-emerald-400 font-mono uppercase text-sm">Operative</th>
                                        <th className="text-center p-3 text-amber-400 font-mono uppercase text-sm">CO</th>
                                        <th className="text-center p-3 text-red-400 font-mono uppercase text-sm">HQ</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-3 text-slate-300 font-mono">Store Personal Credentials</td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-emerald-400 inline" /></td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                    </tr>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-3 text-slate-300 font-mono">View/Edit Own Credentials</td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-emerald-400 inline" /></td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                    </tr>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-3 text-slate-300 font-mono">Register Passkeys (WebAuthn)</td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-emerald-400 inline" /></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-amber-400 inline" /></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-red-400 inline" /></td>
                                    </tr>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-3 text-slate-300 font-mono">Create Intel Directives</td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-amber-400 inline" /></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-red-400 inline" /></td>
                                    </tr>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-3 text-slate-300 font-mono">Initiate Operations</td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-amber-400 inline" /></td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                    </tr>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-3 text-slate-300 font-mono">Upload Encrypted Documents</td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-amber-400 inline" /></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-red-400 inline" /></td>
                                    </tr>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-3 text-slate-300 font-mono">View Shared Documents</td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-emerald-400 inline" /> <span className="text-xs text-slate-500">(Read-Only)</span></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-amber-400 inline" /></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-red-400 inline" /></td>
                                    </tr>
                                    <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-3 text-slate-300 font-mono">View All Personnel</td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-red-400 inline" /></td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/30">
                                        <td className="p-3 text-slate-300 font-mono">View Audit Logs (Black Box)</td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                        <td className="text-center p-3"><XCircle className="h-5 w-5 text-slate-700 inline" /></td>
                                        <td className="text-center p-3"><CheckCircle className="h-5 w-5 text-red-400 inline" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Concepts */}
                <Card className="bg-slate-900/50 border-slate-800 mb-6">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <Lock className="h-5 w-5 text-purple-400" />
                            Security Concepts & Features
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Encoding vs Encryption */}
                            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Server className="h-5 w-5 text-cyan-400" />
                                    <h4 className="font-bold text-white uppercase text-sm">Encoding vs Encryption</h4>
                                </div>
                                <div className="space-y-2 text-xs font-mono">
                                    <p className="text-cyan-300">• <span className="text-white">Base64:</span> Format conversion (NOT security) - anyone can decode</p>
                                    <p className="text-cyan-300">• <span className="text-white">AES-256:</span> Symmetric encryption - data unreadable without key</p>
                                </div>
                            </div>

                            {/* Hashing vs Encryption */}
                            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Database className="h-5 w-5 text-indigo-400" />
                                    <h4 className="font-bold text-white uppercase text-sm">Hashing vs Encryption</h4>
                                </div>
                                <div className="space-y-2 text-xs font-mono">
                                    <p className="text-indigo-300">• <span className="text-white">Hashing (PBKDF2):</span> One-way, used for passwords (100,000 iterations with salt)</p>
                                    <p className="text-indigo-300">• <span className="text-white">Encryption (AES):</span> Two-way, used for stored credentials & documents</p>
                                </div>
                            </div>

                            {/* Digital Signatures */}
                            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck className="h-5 w-5 text-purple-400" />
                                    <h4 className="font-bold text-white uppercase text-sm">Digital Signatures</h4>
                                </div>
                                <div className="space-y-2 text-xs font-mono">
                                    <p className="text-purple-300">• <span className="text-white">RSA-PSS:</span> Proves authenticity + integrity</p>
                                    <p className="text-purple-300">• Any tampering invalidates the signature</p>
                                    <p className="text-purple-300">• Used for uploaded documents to verify they haven't been modified</p>
                                </div>
                            </div>

                            {/* Multi-Factor Authentication */}
                            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-5 w-5 text-emerald-400" />
                                    <h4 className="font-bold text-white uppercase text-sm">Multi-Factor Authentication</h4>
                                </div>
                                <div className="space-y-2 text-xs font-mono">
                                    <p className="text-emerald-300">• <span className="text-white">Password:</span> Something you know</p>
                                    <p className="text-emerald-300">• <span className="text-white">Email OTP:</span> 6-digit code, 5-minute expiry</p>
                                    <p className="text-emerald-300">• <span className="text-white">WebAuthn:</span> Biometric passkeys (TouchID, FaceID, Windows Hello)</p>
                                </div>
                            </div>

                            {/* Token Format */}
                            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 md:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lock className="h-5 w-5 text-amber-400" />
                                    <h4 className="font-bold text-white uppercase text-sm">Encrypted Token Format</h4>
                                </div>
                                <div className="space-y-2 text-xs font-mono">
                                    <p className="text-amber-300">
                                        <span className="text-white">Format:</span> Base64( IV[16 bytes] + Signature[256 bytes] + Ciphertext )
                                    </p>
                                    <div className="grid grid-cols-3 gap-4 mt-2">
                                        <div className="p-2 rounded bg-slate-800/50 border border-slate-700">
                                            <p className="text-white font-bold">1. IV</p>
                                            <p className="text-amber-200">Random initialization vector for AES</p>
                                        </div>
                                        <div className="p-2 rounded bg-slate-800/50 border border-slate-700">
                                            <p className="text-white font-bold">2. Signature</p>
                                            <p className="text-amber-200">RSA-PSS signature of ciphertext</p>
                                        </div>
                                        <div className="p-2 rounded bg-slate-800/50 border border-slate-700">
                                            <p className="text-white font-bold">3. Ciphertext</p>
                                            <p className="text-amber-200">AES-256-CBC encrypted payload</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Operations - Tamper Detection */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-purple-400" />
                            Operations Integrity (Tamper Detection)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="mb-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                            <p className="text-sm text-purple-400 font-mono flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                All operations are digitally signed with RSA-2048-PSS. Verify signatures to detect tampering.
                            </p>
                        </div>
                        
                        {operations.length === 0 ? (
                            <div className="text-center py-8">
                                <Rocket className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 font-mono">No operations submitted yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {operations.map((op: any) => (
                                    <div key={op.id} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                    <Rocket className="h-5 w-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white">{op.operative_name}</h4>
                                                    <p className="text-xs font-mono text-slate-500">
                                                        Budget: ${op.budget_amount?.toLocaleString()} • {new Date(op.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {op.has_signature && (
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                        <Lock className="h-3 w-3 mr-1" />
                                                        Signed
                                                    </Badge>
                                                )}
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleTamperOperation(op.id)}
                                                    disabled={tampering[op.id]}
                                                    className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase"
                                                >
                                                    {tampering[op.id] ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Tamper
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleVerifyOperation(op.id)}
                                                    disabled={verifying[op.id]}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs uppercase"
                                                >
                                                    {verifying[op.id] ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Shield className="h-3 w-3 mr-1" />
                                                            Verify
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {verificationResults[op.id] && (
                                            <Alert className={verificationResults[op.id]?.valid 
                                                ? 'bg-emerald-500/10 border-emerald-500/30' 
                                                : 'bg-red-500/10 border-red-500/30'}>
                                                {verificationResults[op.id]?.valid ? (
                                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-400" />
                                                )}
                                                <AlertDescription className={verificationResults[op.id]?.valid ? 'text-emerald-400' : 'text-red-400'}>
                                                    {verificationResults[op.id]?.valid 
                                                        ? '✅ AUTHENTIC - Digital signature verified. No tampering detected.' 
                                                        : '❌ TAMPERED - Digital signature invalid. Data integrity compromised!'}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
