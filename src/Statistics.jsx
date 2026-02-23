import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend
} from 'recharts';
import { Sparkles, Users, Activity, TrendingUp } from 'lucide-react';
import './chart-overrides.css';

const Statistics = ({ data }) => {

    // --- 1. BIAS NORMALIZATION & COUNTING ---
    const biasData = useMemo(() => {
        const counts = {
            Jisoo: 0,
            Jennie: 0,
            Rosé: 0,
            Lisa: 0
        };

        data.forEach(member => {
            // FILTER: Only consider "In Group" members for Bias stats
            if (member.status !== 'In Group') return;

            if (!member.bias) return;
            const biasLower = member.bias.toLowerCase();

            // Helper to check if a string contains any of the keywords
            const has = (keywords) => keywords.some(k => biasLower.includes(k));

            const isOt4 = has(['ot4', 'all', 'blackpink']);
            const isJisoo = has(['jisoo', 'jichu', 'sooya', 'kim jisoo']);
            const isJennie = has(['jennie', 'jendeuk', 'nini', 'kim jennie']);
            const isRose = has(['rose', 'rosé', 'rosie', 'chaeyoung', 'park chaeyoung']);
            const isLisa = has(['lisa', 'lili', 'lalisa', 'manobal']);

            if (isOt4) {
                counts.Jisoo++;
                counts.Jennie++;
                counts.Rosé++;
                counts.Lisa++;
            } else {
                if (isJisoo) counts.Jisoo++;
                if (isJennie) counts.Jennie++;
                if (isRose) counts.Rosé++;
                if (isLisa) counts.Lisa++;
            }
        });

        return [
            { name: 'Jisoo', count: counts.Jisoo, fill: '#8b5cf6' }, // Purple
            { name: 'Jennie', count: counts.Jennie, fill: '#ec4899' }, // Pink
            { name: 'Rosé', count: counts.Rosé, fill: '#f43f5e' }, // Rose
            { name: 'Lisa', count: counts.Lisa, fill: '#eab308' }, // Yellow
        ];
    }, [data]);

    // --- 2. STATUS DISTRIBUTION ---
    const statusData = useMemo(() => {
        const counts = {};
        data.forEach(m => {
            const s = m.status || 'Unknown';
            counts[s] = (counts[s] || 0) + 1;
        });

        return Object.keys(counts).map(key => ({
            name: key,
            value: counts[key]
        }));
    }, [data]);

    const COLORS = ['#22c55e', '#eab308', '#ef4444', '#f79aaf', '#9ca3af']; // Green, Yellow, Red, Pink, Gray

    // --- 3. SCORE DISTRIBUTION ---
    const scoreData = useMemo(() => {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        data.forEach(m => {
            if (m.score >= 1 && m.score <= 5) {
                counts[m.score]++;
            }
        });
        return Object.keys(counts).map(k => ({ score: k, count: counts[k] }));
    }, [data]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Header Stats */}
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider">Total Members (In Group)</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                            {data.filter(m => m.status === 'In Group').length}
                        </h3>
                    </div>
                    <div className="p-3 bg-cyan-500/10 rounded-full text-cyan-400">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider">Top Bias</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                            {biasData.reduce((prev, current) => (prev.count > current.count) ? prev : current).name}
                        </h3>
                    </div>
                    <div className="p-3 bg-pink-500/10 rounded-full text-pink-400">
                        <Sparkles size={24} />
                    </div>
                </div>
            </div>

            {/* BIAS CHART */}
            <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-xl">
                <h3 className="text-lg font-light text-white mb-6 flex items-center">
                    <Sparkles className="mr-2 text-pink-500" size={20} /> Bias Distribution
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={biasData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#e5e7eb' }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#9ca3af" tick={{ fill: '#e5e7eb' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1500}>
                                {biasData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* STATUS CHART */}
                <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-light text-white mb-6 flex items-center">
                        <Activity className="mr-2 text-green-500" size={20} /> Member Status
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* SCORE CHART */}
                <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-xl">
                    <h3 className="text-lg font-light text-white mb-6 flex items-center">
                        <TrendingUp className="mr-2 text-blue-500" size={20} /> Engagement Scores
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="score" stroke="#9ca3af" tick={{ fill: '#e5e7eb' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#9ca3af" tick={{ fill: '#e5e7eb' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Statistics;
