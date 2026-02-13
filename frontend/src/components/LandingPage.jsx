import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, CloudSun, MapPin, Search } from 'lucide-react';

// Actually, let's stick to consistent styling as Dashboard.jsx without external ui lib complexity

function LandingPage({ onStart }) {
    const [config, setConfig] = useState({
        city: 'Delhi',
        restaurantName: 'The Sustainable Kitchen',
        simulationDays: 7,
        eventFlag: 0
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleStart = (e) => {
        e.preventDefault();
        onStart(config);
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, duration: 0.6 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-background to-transparent -z-10" />
            <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

            <motion.div
                className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full z-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 shadow-lg shadow-primary/20 border border-primary/20">
                        <span className="text-4xl">🍔</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">
                        Resurge AI
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        AI-driven demand forecasting and surplus management for sustainable food businesses.
                    </p>
                </motion.div>

                {/* Input Card */}
                <motion.div
                    variants={itemVariants}
                    className="w-full max-w-lg bg-card/80 backdrop-blur-md border border-border rounded-2xl p-8 shadow-2xl relative group"
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-emerald-500 rounded-2xl opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200"></div>

                    <form onSubmit={handleStart} className="relative space-y-6">

                        <div className="space-y-4">
                            {/* Restaurant Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <span className="bg-primary/10 p-1 rounded-md"><TrendingUp size={16} className="text-primary" /></span>
                                    Restaurant Name
                                </label>
                                <input
                                    type="text"
                                    name="restaurantName"
                                    value={config.restaurantName}
                                    onChange={handleChange}
                                    placeholder="e.g. Burger King CP"
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                                    required
                                />
                            </div>

                            {/* Location Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <span className="bg-blue-500/10 p-1 rounded-md"><MapPin size={16} className="text-blue-500" /></span>
                                        Location
                                    </label>
                                    <select
                                        name="city"
                                        value={config.city}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                    >
                                        <option value="Delhi">Delhi, India</option>
                                        <option value="Mumbai">Mumbai, India</option>
                                        <option value="Bangalore">Bangalore, India</option>
                                        <option value="Custom">Custom...</option>
                                    </select>
                                </div>

                                {config.city === 'Custom' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-left-4">
                                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                            Enter City Name
                                        </label>
                                        <input
                                            type="text"
                                            name="city" // This might conflict with select if handled poorly, but for simple MVP let's assume intuitive override or separate field. Actually let's keep separate field to avoid complexity
                                            // Simplified: Just use select for now, or text input if needed. The Dashboard handles city text input.
                                            // Let's stick to the select for the main flow, or allow typing if 'Custom' is selected. 
                                            // Actually, let's keep it simple: Select only for MVP landing.
                                            disabled
                                            placeholder="Type city..."
                                            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm cursor-not-allowed"
                                        />
                                    </div>
                                )}

                                {/* Simulation Days */}
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <span className="bg-amber-500/10 p-1 rounded-md"><CloudSun size={16} className="text-amber-500" /></span>
                                        Horizon (Days)
                                    </label>
                                    <div className="flex items-center gap-4 bg-background border border-border rounded-lg px-4 py-2.5">
                                        <input
                                            type="range"
                                            name="simulationDays"
                                            min="3"
                                            max="14"
                                            value={config.simulationDays}
                                            onChange={handleChange}
                                            className="flex-1 accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="font-mono text-sm font-bold w-6 text-right">{config.simulationDays}</span>
                                    </div>
                                </div>
                            </div>


                            {/* Event Toggle */}
                            <div className="pt-2">
                                <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background/50 hover:bg-secondary/50 transition-colors cursor-pointer group/check">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            name="eventFlag"
                                            checked={config.eventFlag === 1}
                                            onChange={handleChange}
                                            className="peer sr-only"
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-foreground">Include Special Events</span>
                                        <p className="text-xs text-muted-foreground">Simulate high-demand scenario (e.g. festivals)</p>
                                    </div>
                                </label>
                            </div>

                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 py-6 text-lg font-semibold shadow-lg shadow-primary/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Play className="mr-2 h-5 w-5" /> Initialize System
                        </Button>

                    </form>
                </motion.div>

                {/* Footer */}
                <motion.div variants={itemVariants} className="mt-8 flex gap-6 text-muted-foreground text-sm">
                    <span className="flex items-center gap-1"><Search size={14} /> v2.0 Model Loaded</span>
                    <span className="flex items-center gap-1">•</span>
                    <span>Real-time Weather Integration</span>
                </motion.div>

            </motion.div>
        </div>
    );
}

// Simple internal Button component to avoid import issues if not set up
function Button({ className, children, ...props }) {
    return (
        <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground ${className}`} {...props}>
            {children}
        </button>
    )
}

export default LandingPage;
