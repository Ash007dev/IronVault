'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { intelApi } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ShieldCheck, Plus, FileText, Radio, Moon, Sun, LogOut, ArrowLeft,
    Send, Trash2, Clock, AlertCircle, Check, Loader2, Briefcase, Lock
} from 'lucide-react';

export default function DirectivesPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [directives, setDirectives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [intelType, setIntelType] = useState('Field Report');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const u = JSON.parse(stored);
        if (u.role !== 'co') {
            router.push('/');
            return;
        }
        setUser(u);
        loadDirectives();
    }, [router]);

    const loadDirectives = async () => {
        try {
            const data = await intelApi.getAll();
            setDirectives(data.intel || []);
        } catch (err) {
            console.error('Failed to load directives:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await intelApi.create({
                title,
                description,
                content,
                intel_type: intelType,
            });
            setSuccess('Directive issued successfully!');
            setTitle('');
            setDescription('');
            setContent('');
            setShowForm(false);
            loadDirectives();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to issue directive');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this directive?')) return;
        
        try {
            await intelApi.delete(id);
            setSuccess('Directive deleted');
            loadDirectives();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete directive');
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

                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/co/dashboard" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Command
                            </Link>
                            <Link href="/co/directives" className="text-amber-400 font-mono text-sm uppercase tracking-wider">
                                Directives
                            </Link>
                            <Link href="/profile" className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors">
                                Profile
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-white">
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                                <Briefcase className="h-4 w-4 text-amber-400" />
                                <span className="text-sm font-mono text-amber-400">{user?.username}</span>
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
                    <div className="flex items-center gap-4">
                        <Link href="/co/dashboard">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <Send className="h-8 w-8 text-amber-400" />
                                Directives
                            </h1>
                            <p className="text-slate-500 font-mono mt-1">Issue encrypted intel to operatives</p>
                        </div>
                    </div>

                    <Button 
                        onClick={() => setShowForm(!showForm)}
                        className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 font-mono uppercase tracking-wider"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {showForm ? 'Cancel' : 'New Directive'}
                    </Button>
                </div>

                {/* Alerts */}
                {error && (
                    <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-mono">{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="mb-6 bg-emerald-500/10 border-emerald-500/30">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <AlertDescription className="text-emerald-500 font-mono">{success}</AlertDescription>
                    </Alert>
                )}

                {/* New Directive Form */}
                {showForm && (
                    <Card className="bg-slate-900/50 border-slate-800 mb-8">
                        <CardHeader className="border-b border-slate-800">
                            <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                                <Lock className="h-5 w-5 text-amber-400" />
                                Issue New Directive
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 font-mono text-xs uppercase tracking-wider">Title *</Label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Operation codename..."
                                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 font-mono"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 font-mono text-xs uppercase tracking-wider">Intel Type</Label>
                                        <select
                                            value={intelType}
                                            onChange={(e) => setIntelType(e.target.value)}
                                            className="w-full h-10 px-3 rounded-md bg-slate-800/50 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="Field Report">Field Report</option>
                                            <option value="Mission Brief">Mission Brief</option>
                                            <option value="Intel Report">Intel Report</option>
                                            <option value="Tactical Plan">Tactical Plan</option>
                                            <option value="Urgent Alert">Urgent Alert</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 font-mono text-xs uppercase tracking-wider">Description</Label>
                                    <Input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Brief summary..."
                                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 font-mono text-xs uppercase tracking-wider">Content * (AES-256 Encrypted)</Label>
                                    <Textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Classified intel content..."
                                        rows={6}
                                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 font-mono resize-none"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-4">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => setShowForm(false)}
                                        className="font-mono uppercase tracking-wider text-slate-400"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 font-mono uppercase tracking-wider"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Encrypting...</>
                                        ) : (
                                            <><Send className="h-4 w-4 mr-2" /> Issue Directive</>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Directives List */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-5 w-5 text-amber-400" />
                            Active Directives ({directives.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                            </div>
                        ) : directives.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">No Directives</h3>
                                <p className="text-slate-500 font-mono mb-6">Issue your first encrypted directive</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {directives.map((directive: any) => (
                                    <div key={directive.id} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-5 w-5 text-amber-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <h3 className="font-bold text-white">{directive.title}</h3>
                                                        <Badge variant="outline" className="text-amber-400 border-amber-500/30 font-mono text-xs">
                                                            {directive.intel_type}
                                                        </Badge>
                                                    </div>
                                                    {directive.description && (
                                                        <p className="text-slate-400 text-sm mb-2">{directive.description}</p>
                                                    )}
                                                    <div className="bg-slate-900/50 rounded-md p-3 border border-slate-700/30">
                                                        <p className="text-slate-300 font-mono text-sm whitespace-pre-wrap">{directive.content}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 font-mono">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(directive.created_at).toLocaleString()}
                                                        <span className="text-emerald-500 flex items-center gap-1 ml-2">
                                                            <Lock className="h-3 w-3" /> AES-256 Encrypted
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(directive.id)}
                                                className="text-slate-500 hover:text-red-400 flex-shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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
