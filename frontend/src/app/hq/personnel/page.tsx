'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    ShieldCheck, Users, Moon, Sun, LogOut, Search, User, Crown,
    Shield, ArrowLeft, Loader2, UserCheck, UserX
} from 'lucide-react';

export default function PersonnelPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
        loadPersonnel();
    }, [router]);

    const loadPersonnel = async () => {
        try {
            const data = await adminApi.getUsers();
            setPersonnel(data.users || []);
        } catch (err) {
            console.error('Failed to load personnel:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'operative':
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">OPERATIVE</Badge>;
            case 'co':
                return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">OFFICER</Badge>;
            case 'hq':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">COMMAND</Badge>;
            default:
                return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{role.toUpperCase()}</Badge>;
        }
    };

    const filteredPersonnel = personnel.filter(p =>
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                            <Link href="/hq/dashboard" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                HQ
                            </Link>
                            <Link href="/hq/personnel" className="text-blue-400 font-mono text-sm uppercase tracking-wider">
                                Personnel
                            </Link>
                            <Link href="/hq/warroom" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                War Room
                            </Link>
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
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Back Button */}
                <Link href="/hq/dashboard">
                    <Button variant="ghost" className="mb-6 text-slate-400 hover:text-white font-mono uppercase tracking-wider">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to HQ
                    </Button>
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-400" />
                            Personnel Roster
                        </h1>
                        <p className="text-slate-500 font-mono mt-1">All registered operatives and officers</p>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search personnel..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-800/50 border-slate-700 text-white font-mono"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <User className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {personnel.filter(p => p.role === 'operative').length}
                                </p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Operatives</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {personnel.filter(p => p.role === 'co').length}
                                </p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Officers</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <Crown className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {personnel.filter(p => p.role === 'hq').length}
                                </p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Command</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Personnel Table */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="text-left p-4 text-xs font-mono text-slate-500 uppercase tracking-wider">Callsign</th>
                                            <th className="text-left p-4 text-xs font-mono text-slate-500 uppercase tracking-wider">Comm Channel</th>
                                            <th className="text-left p-4 text-xs font-mono text-slate-500 uppercase tracking-wider">Designation</th>
                                            <th className="text-left p-4 text-xs font-mono text-slate-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPersonnel.map((p, index) => (
                                            <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <span className="font-mono text-white">{p.username}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-mono text-slate-400">{p.email || '-'}</td>
                                                <td className="p-4">{getRoleBadge(p.role)}</td>
                                                <td className="p-4">
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                        <UserCheck className="h-3 w-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
