import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981'];

const AdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/admin/analytics');
                setData(res.data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const handleExportPDF = async () => {
        if (!data) return;
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
        ]);
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.setTextColor(79, 70, 229);
        doc.text('AlumniConnect - Analytics Report', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 30);

        // Section 1: User Distribution
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text('User Distribution', 14, 42);

        const roleData = (data.roleDistribution || []).map(item => [item.name, item.value]);
        autoTable(doc, {
            startY: 47,
            head: [['Role', 'Count']],
            body: roleData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10 },
        });

        // Section 2: User Growth Trends
        const afterRoleTable = doc.lastAutoTable.finalY + 12;
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text('User Growth Trends', 14, afterRoleTable);

        const growthData = (data.userGrowth || []).map(item => [item.name, item.students ?? 0, item.alumni ?? 0]);
        autoTable(doc, {
            startY: afterRoleTable + 5,
            head: [['Month', 'Students Joined', 'Alumni Joined']],
            body: growthData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10 },
        });

        // Section 3: Mentorship Trends
        if (data.mentorshipTrends?.length) {
            const afterGrowthTable = doc.lastAutoTable.finalY + 12;
            doc.setFontSize(13);
            doc.setTextColor(30, 41, 59);
            doc.text('Mentorship Engagement', 14, afterGrowthTable);

            const mentorData = data.mentorshipTrends.map(item => [item.name, item.requests ?? 0]);
            autoTable(doc, {
                startY: afterGrowthTable + 5,
                head: [['Month', 'Mentorship Requests']],
                body: mentorData,
                theme: 'grid',
                headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10 },
            });
        }

        doc.save('AlumniConnect_Analytics_Report.pdf');
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
    if (!data) return <div className="empty-state">Failed to load analytics data.</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            <div className="page-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Platform Analytics</h1>
                    <p>Visual insights into platform usage, growth, and engagement.</p>
                </div>
                <button onClick={handleExportPDF} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold' }}>
                    Export PDF Report
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
                
                {/* User Growth Line Chart */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>User Growth Trend</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={data.userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="students" name="Students" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="alumni" name="Alumni" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Mentorship Requests Bar Chart */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Mentorship Engagement</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.mentorshipTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip cursor={{ fill: 'rgba(79,70,229,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Bar dataKey="requests" name="Mentorship Requests" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Role Distribution Pie Chart */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Current User Distribution</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={data.roleDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.roleDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminAnalytics;
