import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, CloudRain, BarChart3, Settings, AlertCircle } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`flex items-center w-full p-3 rounded-lg mb-2 transition-colors ${active
                ? 'bg-primary/10 text-primary border-l-2 border-primary'
                : 'text-slate-400 hover:text-slate-200'
            }`}
    >
        <Icon size={20} className="mr-3" />
        <span className="font-medium text-sm">{label}</span>
    </motion.button>
);

const Layout = ({ children }) => {
    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-64 bg-card border-r border-border p-6 flex flex-col hidden md:flex"
            >
                <div className="mb-10 flex items-center px-2">
                    <div className="w-8 h-8 bg-primary rounded-lg mr-3 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-primary-foreground font-bold">M</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Resurge AI</h1>
                </div>

                <nav className="flex-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" active={true} />
                    <SidebarItem icon={CloudRain} label="Weather Impact" />
                    <SidebarItem icon={BarChart3} label="Analytics" />
                    <SidebarItem icon={AlertCircle} label="Risks" />
                </nav>

                <div className="mt-auto pt-6 border-t border-border">
                    <SidebarItem icon={Settings} label="Settings" />
                </div>

                <div className="text-xs text-muted-foreground mt-4 px-2">
                    v2.0.0 • Connected
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-auto bg-background/50 relative">
                {/* Background gradient blur */}
                <div className="absolute inset-0 bg-primary/5 -z-10 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent -z-10" />

                <header className="h-16 border-b border-border/40 flex items-center justify-between px-8 bg-background/60 backdrop-blur-md sticky top-0 z-20">
                    <div className="text-sm breadcrumbs text-muted-foreground">
                        Overview / <span className="text-foreground font-medium">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-medium text-emerald-500">Live System</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[1px]">
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
