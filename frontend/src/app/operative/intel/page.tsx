'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { intelApi } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    ShieldCheck, Search, Moon, Sun, LogOut, FileText, Radio,
    Clock, Lock, Loader2, Eye, Target, AlertTriangle
} from 'lucide-react';

interface Intel {
    id: number;
    title: string;
    description: string;
    intel_type: string;
    content: string;
    uploaded_by: number;
    created_at: string;
}

export default function OperativeIntelPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [intel, setIntel] = useState<Intel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

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
        loadIntel();
    }, [router]);

    const loadIntel = async () => {
        try {
            const data = await intelApi.getAll();
            setIntel(data.intel || []);
        } catch (err) {
            console.error('Failed to load intel:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const filteredIntel = intel.filter(i =>
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.intel_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'urgent alert': return 'text-red-400 border-red-500/30 bg-red-500/10';
            case 'mission brief': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
            case 'tactical plan': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
            default: return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
        }
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
                            <Link href="/operative/vault" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Vault
                            </Link>
                            <Link href="/operative/intel" className="text-emerald-400 font-mono text-sm uppercase tracking-wider">
                                Intel
                            </Link>
                            <Link href="/profile" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Profile
                            </Link>
                        </div>

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
                            <Radio className="h-8 w-8 text-emerald-400" />
                            Intel Reports
                        </h1>
                        <p className="text-slate-500 font-mono mt-1">Directives from Command</p>
                    </div>

                    <div className="relative md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search intel..."
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
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{intel.length}</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Total Reports</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {intel.filter(i => i.intel_type === 'Urgent Alert').length}
                                </p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Urgent Alerts</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Lock className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">AES-256</p>
                                <p className="text-xs font-mono text-slate-500 uppercase">Decrypted</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Intel List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                ) : filteredIntel.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-12 text-center">
                            <Radio className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">No Intel Available</h3>
                            <p className="text-slate-500 font-mono">Awaiting directives from Command</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredIntel.map((item) => (
                            <Card key={item.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-6 w-6 text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                                    <h3 className="font-bold text-white text-lg">{item.title}</h3>
                                                    <Badge className={`font-mono text-xs ${getTypeColor(item.intel_type)}`}>
                                                        {item.intel_type}
                                                    </Badge>
                                                </div>
                                                {item.description && (
                                                    <p className="text-slate-400 text-sm mb-3">{item.description}</p>
                                                )}
                                                
                                                {/* Content */}
                                                <div className={`bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 ${expandedId === item.id ? '' : 'max-h-24 overflow-hidden'}`}>
                                                    <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap">{item.content}</pre>
                                                </div>
                                                
                                                {item.content.length > 200 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="mt-2 text-emerald-400 hover:text-emerald-300 font-mono text-xs"
                                                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        {expandedId === item.id ? 'Show Less' : 'Show Full Intel'}
                                                    </Button>
                                                )}

                                                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-mono">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(item.created_at).toLocaleString()}
                                                    </span>
                                                    <span className="text-emerald-500 flex items-center gap-1">
                                                        <Lock className="h-3 w-3" /> AES-256 Decrypted
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
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
