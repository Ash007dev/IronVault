'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { credentialsApi } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    ShieldCheck, Plus, Search, Copy, Edit, Trash2, Eye, EyeOff,
    Moon, Sun, LogOut, User, Key, Target, Lock, FileText, Radio,
    Check, AlertCircle, Loader2
} from 'lucide-react';

interface Credential {
    id: number;
    target_system: string;
    callsign: string;
    access_code: string;
    notes: string;
    created_at: string;
}

export default function VaultPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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
        loadCredentials();
    }, [router]);

    const loadCredentials = async () => {
        try {
            const data = await credentialsApi.getAll();
            setCredentials(data.credentials || []);
        } catch (err) {
            console.error('Failed to load credentials:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (id: number, code: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: number) => {
        try {
            await credentialsApi.delete(id);
            setCredentials(credentials.filter(c => c.id !== id));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const toggleReveal = (id: number) => {
        const newSet = new Set(revealedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setRevealedIds(newSet);
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const filteredCredentials = credentials.filter(c =>
        c.target_system.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.callsign.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Floating Top Navigation */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-wider uppercase text-white">
                                Iron<span className="text-emerald-400">Vault</span>
                            </span>
                        </div>

                        {/* Nav Links */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/operative/vault" className="text-emerald-400 font-mono text-sm uppercase tracking-wider">
                                Vault
                            </Link>
                            <Link href="/operative/intel" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Intel
                            </Link>
                            <Link href="/operative/documents" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Documents
                            </Link>
                            <Link href="/profile" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Profile
                            </Link>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-white">
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-sm font-mono text-blue-400">{user?.username}</span>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                            <Key className="h-8 w-8 text-emerald-400" />
                            Tactical Vault
                        </h1>
                        <p className="text-slate-500 font-mono mt-1">Secure credential storage</p>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search intel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-800/50 border-slate-700 text-white font-mono"
                            />
                        </div>
                        <Link href="/operative/vault/add">
                            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 font-mono uppercase tracking-wider">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Intel
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Lock className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{credentials.length}</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Total Credentials</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Target className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{filteredCredentials.length}</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Matching Search</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">AES-256</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Encryption</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Credentials Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                ) : filteredCredentials.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-12 text-center">
                            <Key className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">Vault Empty</h3>
                            <p className="text-slate-500 font-mono mb-6">No credentials stored yet</p>
                            <Link href="/operative/vault/add">
                                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 font-mono uppercase">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add First Credential
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCredentials.map((cred) => (
                            <Card key={cred.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-white uppercase tracking-wider">{cred.target_system}</h3>
                                            <p className="text-sm font-mono text-slate-500">{cred.callsign}</p>
                                        </div>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                            <Lock className="h-3 w-3 mr-1" />
                                            Encrypted
                                        </Badge>
                                    </div>

                                    {/* Access Code Display */}
                                    <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700/50">
                                        <div className="flex items-center justify-between">
                                            <code className="font-mono text-sm text-emerald-400">
                                                {revealedIds.has(cred.id) ? cred.access_code : '••••••••••••'}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-white"
                                                onClick={() => toggleReveal(cred.id)}
                                            >
                                                {revealedIds.has(cred.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {cred.notes && (
                                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{cred.notes}</p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`flex-1 font-mono text-xs uppercase ${copiedId === cred.id ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400'}`}
                                            onClick={() => handleCopy(cred.id, cred.access_code)}
                                        >
                                            {copiedId === cred.id ? (
                                                <><Check className="h-3 w-3 mr-1" /> Copied</>
                                            ) : (
                                                <><Copy className="h-3 w-3 mr-1" /> Copy</>
                                            )}
                                        </Button>
                                        <Link href={`/operative/vault/edit/${cred.id}`}>
                                            <Button variant="outline" size="sm" className="border-slate-700 text-slate-400">
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                        {deleteConfirm === cred.id ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-red-500 text-red-400"
                                                onClick={() => handleDelete(cred.id)}
                                            >
                                                Confirm
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-slate-700 text-slate-400 hover:border-red-500 hover:text-red-400"
                                                onClick={() => setDeleteConfirm(cred.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
