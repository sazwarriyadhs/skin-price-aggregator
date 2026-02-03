import { useState, useEffect } from "react";
import { Search, RefreshCw, TrendingUp, Heart, ExternalLink, AlertCircle, Check, Shield, BarChart3, Twitter, Menu, X, ChevronRight, LineChart, Calendar, Filter, Download, Eye, EyeOff, Plus, Trash2, Bell, Clock, TrendingDown, DollarSign, Percent, Zap, BarChart, PieChart } from "lucide-react";
import scLogo from "./assets/images/sclogo.png";
import "./App.css";

const API_BASE_URL = "http://localhost:3000";

export default function SkinPriceAggregator() {
  const [query, setQuery] = useState("AK-47 Redline");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("03:56 PM");
  const [refreshCount, setRefreshCount] = useState(0);
  const [healthStatus, setHealthStatus] = useState("Connected");
  const [activeTab, setActiveTab] = useState("priceTracker"); // Changed to priceTracker
  const [favorites, setFavorites] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Price Tracker State
  const [trackedSkins, setTrackedSkins] = useState([
    {
      id: 1,
      name: "AK-47 | Redline",
      wear: "Factory New",
      currentPrice: "$87.06",
      lowestPrice: "$71.66",
      highestPrice: "$89.50",
      priceChange: "+1,145%",
      change7d: "+12.5%",
      change30d: "+25.3%",
      market: "bitskins",
      volume: "3,905",
      alertThreshold: "$70.00",
      notifications: true,
      chartData: [85.00, 86.50, 84.20, 87.06, 86.80, 87.50, 87.06]
    },
    {
      id: 2,
      name: "Karambit | Doppler",
      wear: "Phase 2",
      currentPrice: "$967.99",
      lowestPrice: "$890.00",
      highestPrice: "$980.50",
      priceChange: "-2.9%",
      change7d: "-5.2%",
      change30d: "+3.4%",
      market: "skinport",
      volume: "1,205",
      alertThreshold: "$850.00",
      notifications: true,
      chartData: [980.50, 970.20, 965.40, 960.80, 967.99, 970.50, 967.99]
    },
    {
      id: 3,
      name: "M4A1-S | Printstream",
      wear: "Minimal Wear",
      currentPrice: "$165.00",
      lowestPrice: "$155.00",
      highestPrice: "$170.50",
      priceChange: "+5.2%",
      change7d: "+8.7%",
      change30d: "+15.3%",
      market: "steam",
      volume: "2,345",
      alertThreshold: "$160.00",
      notifications: false,
      chartData: [155.00, 158.50, 162.00, 160.50, 163.20, 165.00, 164.80]
    },
    {
      id: 4,
      name: "AWP | Asiimov",
      wear: "Field-Tested",
      currentPrice: "$434.00",
      lowestPrice: "$410.00",
      highestPrice: "$445.50",
      priceChange: "+3.8%",
      change7d: "+6.2%",
      change30d: "+9.7%",
      market: "bitskins",
      volume: "1,890",
      alertThreshold: "$420.00",
      notifications: true,
      chartData: [420.00, 425.50, 430.20, 428.80, 432.50, 434.00, 433.50]
    }
  ]);

  const [newTrackedSkin, setNewTrackedSkin] = useState({
    name: "",
    wear: "Factory New",
    alertThreshold: "",
    notifications: true
  });

  const [chartType, setChartType] = useState("line"); // line, bar, area
  const [timeRange, setTimeRange] = useState("7d"); // 1d, 7d, 30d, 90d
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);

  // Mock price history data
  const mockPriceHistory = [
    { date: "2024-01-01", price: 82.50, market: "steam" },
    { date: "2024-01-02", price: 83.20, market: "bitskins" },
    { date: "2024-01-03", price: 81.80, market: "skinport" },
    { date: "2024-01-04", price: 84.50, market: "steam" },
    { date: "2024-01-05", price: 85.20, market: "bitskins" },
    { date: "2024-01-06", price: 86.00, market: "skinport" },
    { date: "2024-01-07", price: 87.06, market: "steam" },
  ];

  // Featured skin data
  const [featuredSkin, setFeaturedSkin] = useState({
    name: "AK-47 Redline",
    wear: "Factory New",
    steamPrice: "$87.06",
    steamVolume: "79,900",
    lowestPrice: "$71.66",
    market: "bitskins",
    trending: {
      change: "+1,145%",
      volume: "3,905",
      period: "7 Days"
    }
  });

  // Trending skins (sample data)
  const trendingSkins = [
    { id: 1, name: "Karambit | Doppler", wear: "Phase 2", price: "$967.99", change: "-2.9%", period: "7 Days", trend: "down" },
    { id: 2, name: "AK-47 | Neon Rider", wear: "Field-Tested", price: "$72.40", change: "+9.9%", period: "7 Days", trend: "up" },
    { id: 3, name: "M4A1-S | Printstream", wear: "Minimal Wear", price: "$165.00", change: "+5.2%", period: "7 Days", trend: "up" },
  ];

  // Best deals (sample data)
  const bestDeals = [
    { id: 1, name: "Karambit | Doppler", market: "Skinport", price: "$367.99", discount: "$65.99", discountPercent: "15%" },
    { id: 2, name: "M4A1-S | Printstream", market: "Bitskins", price: "$165.00", discount: "$129.99", discountPercent: "21%" },
    { id: 3, name: "AWP | Asiimov", market: "Steam", price: "$434.00", discount: "$96.34", discountPercent: "18%" },
  ];

  // Popular searches
  const popularSkins = [
    "AK-47 Redline", "M4A4 Howl", "AWP Dragon Lore", 
    "Karambit Doppler", "Butterfly Knife", "Glock-18 Fade"
  ];

  // Fetch skin prices from API
  const fetchSkinPrices = async (skinName) => {
    if (!skinName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching prices for: ${skinName}`);
      const response = await fetch(
        `${API_BASE_URL}/api/prices?item=${encodeURIComponent(skinName.trim())}`
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      
      setSearchResults(data);
      updateFeaturedSkin(data, skinName);
      
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(timeString);
      setRefreshCount(prev => prev + 1);
      
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Update featured skin data from API response
  const updateFeaturedSkin = (apiData, skinName) => {
    if (!apiData || !apiData.listings || apiData.listings.length === 0) return;
    
    const listings = apiData.listings;
    const cheapest = listings.reduce((min, listing) => 
      listing.price < min.price ? listing : min
    );
    
    const steamListing = listings.find(l => l.marketplace === 'steam');
    
    setFeaturedSkin(prev => ({
      ...prev,
      name: apiData.itemName || skinName || prev.name,
      steamPrice: steamListing ? formatPrice(steamListing.price) : prev.steamPrice,
      lowestPrice: cheapest ? formatPrice(cheapest.price) : prev.lowestPrice,
      market: cheapest ? cheapest.marketplace : prev.market,
    }));
  };

  // Check API health
  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setHealthStatus("Connected");
        return true;
      } else {
        setHealthStatus("Disconnected");
        return false;
      }
    } catch {
      setHealthStatus("Disconnected");
      return false;
    }
  };

  // Price Tracker Functions
  const addTrackedSkin = () => {
    if (!newTrackedSkin.name.trim()) return;
    
    const newSkin = {
      id: trackedSkins.length + 1,
      name: newTrackedSkin.name,
      wear: newTrackedSkin.wear,
      currentPrice: "$0.00",
      lowestPrice: "$0.00",
      highestPrice: "$0.00",
      priceChange: "0%",
      change7d: "0%",
      change30d: "0%",
      market: "steam",
      volume: "0",
      alertThreshold: newTrackedSkin.alertThreshold || "$0.00",
      notifications: newTrackedSkin.notifications,
      chartData: [0, 0, 0, 0, 0, 0, 0]
    };
    
    setTrackedSkins([...trackedSkins, newSkin]);
    setNewTrackedSkin({
      name: "",
      wear: "Factory New",
      alertThreshold: "",
      notifications: true
    });
  };

  const removeTrackedSkin = (id) => {
    setTrackedSkins(trackedSkins.filter(skin => skin.id !== id));
  };

  const toggleNotifications = (id) => {
    setTrackedSkins(trackedSkins.map(skin => 
      skin.id === id ? { ...skin, notifications: !skin.notifications } : skin
    ));
  };

  const viewSkinDetails = (skin) => {
    setSelectedSkin(skin);
    setPriceHistory(mockPriceHistory);
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    fetchSkinPrices(query);
  };

  const handlePopularSearch = (skin) => {
    setQuery(skin);
    fetchSkinPrices(skin);
  };

  const handleRefresh = () => {
    if (query.trim()) {
      fetchSkinPrices(query);
    } else {
      fetchSkinPrices("AK-47 Redline");
    }
  };

  const toggleFavorite = (skinName) => {
    setFavorites(prev => {
      if (prev.includes(skinName)) {
        return prev.filter(name => name !== skinName);
      } else {
        return [...prev, skinName];
      }
    });
  };

  const formatPrice = (price) => {
    if (typeof price === 'string') {
      if (price.startsWith('$')) return price;
      const num = parseFloat(price.replace(/[^0-9.-]+/g, ""));
      if (!isNaN(num)) price = num;
    }
    
    if (typeof price === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    }
    
    return price || "$0.00";
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && query.trim()) {
      const interval = setInterval(() => {
        fetchSkinPrices(query);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, query]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await checkHealth();
      fetchSkinPrices("AK-47 Redline");
    };
    init();
  }, []);

  // Get current time for display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* HEADER */}
        <header className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={scLogo} alt="Skin Price Aggregator Logo" className="h-8 md:h-10"/>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">Skin Price Aggregator</h1>
                  <p className="text-xs md:text-sm text-gray-400">Find the Best Deals on Skins</p>
                </div>
              </div>
              
              <button 
                className="md:hidden p-2 text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
            
            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${healthStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-300">
                  API: <span className="font-medium text-white">{healthStatus}</span>
                </span>
              </div>
              
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white text-sm md:text-base rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              
              <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Updated: <span className="text-white font-medium">{lastUpdated}</span></span>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="hidden md:flex gap-1 border-b border-gray-800">
            {[
              { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={16} /> },
              { id: "priceTracker", label: "Price Tracker", icon: <LineChart size={16} /> },
              { id: "analytics", label: "Analytics", icon: <PieChart size={16} /> },
              { id: "favorites", label: "Favorites", icon: <Heart size={16} /> },
              { id: "twitter", label: "Twitter profiles", icon: <Twitter size={16} /> }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 py-3 px-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === item.id 
                    ? 'border-blue-500 text-blue-400 bg-blue-900/20' 
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* MOBILE NAVIGATION */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
              <div className="space-y-2">
                {[
                  { id: "dashboard", label: "Dashboard" },
                  { id: "priceTracker", label: "Price Tracker" },
                  { id: "analytics", label: "Analytics" },
                  { id: "favorites", label: "Favorites" },
                  { id: "twitter", label: "Twitter profiles" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id 
                        ? 'bg-blue-900/30 text-blue-400 border-l-2 border-blue-500' 
                        : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {item.id === "dashboard" && <BarChart3 size={18} />}
                    {item.id === "priceTracker" && <LineChart size={18} />}
                    {item.id === "analytics" && <PieChart size={18} />}
                    {item.id === "favorites" && <Heart size={18} />}
                    {item.id === "twitter" && <Twitter size={18} />}
                    {item.label}
                    {activeTab === item.id && <ChevronRight size={16} className="ml-auto text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* MAIN CONTENT */}
        <main className="mb-8">
          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-xl">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <span className="font-medium">API Connection Error</span>
              </div>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          )}

          {/* PRICE TRACKER CONTENT */}
          {activeTab === "priceTracker" && (
            <div className="space-y-6">
              {/* HEADER SECTION */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                    <LineChart className="text-blue-400" size={28} />
                    Price Tracker
                  </h2>
                  <p className="text-gray-400 mt-1">Track and monitor skin prices in real-time</p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setChartType(chartType === "line" ? "bar" : "line")}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                  >
                    {chartType === "line" ? <BarChart size={18} /> : <LineChart size={18} />}
                    {chartType === "line" ? "Bar Chart" : "Line Chart"}
                  </button>
                  
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                  >
                    <option value="1d">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                  
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download size={18} />
                    Export Data
                  </button>
                </div>
              </div>

              {/* ADD NEW SKIN TO TRACK */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-blue-400" />
                  Add Skin to Track
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Skin Name</label>
                    <input
                      type="text"
                      value={newTrackedSkin.name}
                      onChange={(e) => setNewTrackedSkin({...newTrackedSkin, name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., AK-47 Redline"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Wear</label>
                    <select
                      value={newTrackedSkin.wear}
                      onChange={(e) => setNewTrackedSkin({...newTrackedSkin, wear: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Factory New">Factory New</option>
                      <option value="Minimal Wear">Minimal Wear</option>
                      <option value="Field-Tested">Field-Tested</option>
                      <option value="Well-Worn">Well-Worn</option>
                      <option value="Battle-Scarred">Battle-Scarred</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Alert Threshold</label>
                    <input
                      type="text"
                      value={newTrackedSkin.alertThreshold}
                      onChange={(e) => setNewTrackedSkin({...newTrackedSkin, alertThreshold: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., $70.00"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={addTrackedSkin}
                      disabled={!newTrackedSkin.name.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus size={18} />
                      Add to Tracker
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={newTrackedSkin.notifications}
                    onChange={(e) => setNewTrackedSkin({...newTrackedSkin, notifications: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notifications" className="text-sm text-gray-400">
                    Enable price change notifications
                  </label>
                </div>
              </div>

              {/* TRACKED SKINS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN - Tracked Skins List */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Eye size={20} className="text-blue-400" />
                        Tracked Skins ({trackedSkins.length})
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock size={16} />
                        Updated: {lastUpdated}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {trackedSkins.map((skin) => (
                        <div key={skin.id} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer group"
                             onClick={() => viewSkinDetails(skin)}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                parseFloat(skin.priceChange.replace(/[^0-9.-]+/g, "")) >= 0 
                                  ? 'bg-green-900/30' 
                                  : 'bg-red-900/30'
                              }`}>
                                {parseFloat(skin.priceChange.replace(/[^0-9.-]+/g, "")) >= 0 
                                  ? <TrendingUp size={20} className="text-green-400" />
                                  : <TrendingDown size={20} className="text-red-400" />
                                }
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm md:text-base">{skin.name}</div>
                                <div className="text-xs text-gray-400">{skin.wear}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleNotifications(skin.id);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  skin.notifications 
                                    ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' 
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                              >
                                {skin.notifications ? <Bell size={16} /> : <Bell size={16} />}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTrackedSkin(skin.id);
                                }}
                                className="p-1.5 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-xs text-gray-400 mb-1">Current Price</div>
                              <div className="font-bold text-lg text-white">{skin.currentPrice}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-400 mb-1">24h Change</div>
                              <div className={`font-bold text-lg ${
                                parseFloat(skin.priceChange.replace(/[^0-9.-]+/g, "")) >= 0 
                                  ? 'text-green-400' 
                                  : 'text-red-400'
                              }`}>
                                {skin.priceChange}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-400 mb-1">Volume</div>
                              <div className="font-bold text-lg text-white">{skin.volume}</div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-4">
                              <span>Low: {skin.lowestPrice}</span>
                              <span>High: {skin.highestPrice}</span>
                            </div>
                            <span className="capitalize">{skin.market}</span>
                          </div>
                          
                          {/* Mini Chart */}
                          <div className="mt-4 h-10 flex items-end gap-1">
                            {skin.chartData.map((value, index) => (
                              <div 
                                key={index}
                                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all group-hover:from-blue-400 group-hover:to-blue-300"
                                style={{ height: `${(value / Math.max(...skin.chartData)) * 100}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Selected Skin Details & Stats */}
                <div className="space-y-6">
                  {/* SELECTED SKIN DETAILS */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <BarChart3 size={20} className="text-blue-400" />
                      {selectedSkin ? `${selectedSkin.name} Details` : 'Select a Skin'}
                    </h3>
                    
                    {selectedSkin ? (
                      <div className="space-y-6">
                        {/* Price Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                            <div className="text-xs text-gray-400 mb-1">Current</div>
                            <div className="font-bold text-2xl text-white">{selectedSkin.currentPrice}</div>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                            <div className="text-xs text-gray-400 mb-1">7D Change</div>
                            <div className={`font-bold text-2xl ${
                              parseFloat(selectedSkin.change7d.replace(/[^0-9.-]+/g, "")) >= 0 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              {selectedSkin.change7d}
                            </div>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                            <div className="text-xs text-gray-400 mb-1">30D Change</div>
                            <div className={`font-bold text-2xl ${
                              parseFloat(selectedSkin.change30d.replace(/[^0-9.-]+/g, "")) >= 0 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              {selectedSkin.change30d}
                            </div>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                            <div className="text-xs text-gray-400 mb-1">Alert At</div>
                            <div className="font-bold text-xl text-yellow-400">{selectedSkin.alertThreshold}</div>
                          </div>
                        </div>
                        
                        {/* Chart Placeholder */}
                        <div className="bg-gray-900/50 p-4 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="font-bold text-white">Price History ({timeRange})</div>
                              <div className="text-sm text-gray-400">{chartType === "line" ? "Line Chart" : "Bar Chart"}</div>
                            </div>
                            <div className="flex gap-2">
                              <button className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm">1D</button>
                              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">7D</button>
                              <button className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm">30D</button>
                            </div>
                          </div>
                          
                          {/* Mock Chart */}
                          <div className="h-64 bg-gray-800/30 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <LineChart size={48} className="text-blue-400 mx-auto mb-4" />
                              <div className="text-gray-400">Interactive chart would appear here</div>
                              <div className="text-sm text-gray-500 mt-2">Showing {selectedSkin.name} price history</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Price History Table */}
                        <div>
                          <div className="font-bold text-white mb-3">Recent Price History</div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-left text-xs text-gray-400 border-b border-gray-800">
                                  <th className="pb-2">Date</th>
                                  <th className="pb-2">Price</th>
                                  <th className="pb-2">Market</th>
                                  <th className="pb-2">Change</th>
                                </tr>
                              </thead>
                              <tbody>
                                {priceHistory.map((item, index) => (
                                  <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="py-3 text-sm">{item.date}</td>
                                    <td className="py-3 font-medium">${item.price.toFixed(2)}</td>
                                    <td className="py-3 text-sm text-gray-400 capitalize">{item.market}</td>
                                    <td className="py-3">
                                      <span className={`text-sm ${
                                        index > 0 && item.price > priceHistory[index-1].price 
                                          ? 'text-green-400' 
                                          : index > 0 ? 'text-red-400' : 'text-gray-400'
                                      }`}>
                                        {index > 0 
                                          ? `${item.price > priceHistory[index-1].price ? '+' : ''}${(item.price - priceHistory[index-1].price).toFixed(2)}`
                                          : '-'
                                        }
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <EyeOff size={48} className="text-gray-600 mx-auto mb-4" />
                        <div className="text-gray-400">Select a skin from the list to view detailed analytics</div>
                      </div>
                    )}
                  </div>
                  
                  {/* MARKET OVERVIEW */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp size={20} className="text-green-400" />
                      Market Overview
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-800/30 rounded-xl">
                        <div className="text-2xl font-bold text-green-400">+8.5%</div>
                        <div className="text-xs text-gray-400 mt-1">Avg. 7D Change</div>
                      </div>
                      <div className="text-center p-4 bg-gray-800/30 rounded-xl">
                        <div className="text-2xl font-bold text-white">$284.50</div>
                        <div className="text-xs text-gray-400 mt-1">Avg. Price</div>
                      </div>
                      <div className="text-center p-4 bg-gray-800/30 rounded-xl">
                        <div className="text-2xl font-bold text-blue-400">1,842</div>
                        <div className="text-xs text-gray-400 mt-1">Daily Volume</div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-400">Most Volatile Skins</div>
                        <Zap size={16} className="text-yellow-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 hover:bg-gray-800/50 rounded-lg">
                          <div className="text-sm">AK-47 Redline</div>
                          <div className="text-sm font-bold text-green-400">+12.5%</div>
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-gray-800/50 rounded-lg">
                          <div className="text-sm">M4A1-S Printstream</div>
                          <div className="text-sm font-bold text-green-400">+8.7%</div>
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-gray-800/50 rounded-lg">
                          <div className="text-sm">Karambit Doppler</div>
                          <div className="text-sm font-bold text-red-400">-5.2%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD CONTENT */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* FEATURED SKIN CARD */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-4 md:p-6 border border-gray-700">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-xl md:text-2xl font-bold text-white">{featuredSkin.name}</h2>
                      <span className="px-2 py-1 bg-gray-700 text-gray-200 text-xs font-medium rounded">
                        {featuredSkin.wear}
                      </span>
                      <button 
                        onClick={() => toggleFavorite(featuredSkin.name)}
                        className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Heart 
                          size={20} 
                          className={favorites.includes(featuredSkin.name) ? "text-red-500 fill-red-500" : "text-gray-400"} 
                        />
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm md:text-base">Real-time prices from multiple marketplaces</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-900/30 text-green-400 text-sm font-medium rounded-full border border-green-800/50 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Live Data
                    </span>
                  </div>
                </div>

                {/* PRICE COMPARISON GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Steam Card */}
                  <div className="price-card-dark bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Steam</span>
                      <span className="text-xs text-gray-500">{featuredSkin.steamVolume}</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-white">
                      {featuredSkin.steamPrice}
                    </div>
                  </div>
                  
                  {/* Lowest Price Card */}
                  <div className="price-card-dark bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Lowest Price</span>
                      <span className="text-xs text-gray-500 capitalize">{featuredSkin.market}</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-white">
                      {featuredSkin.lowestPrice}
                    </div>
                  </div>
                  
                  {/* Trending Card */}
                  <div className="price-card-dark bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Trending</span>
                      <TrendingUp size={18} className="text-green-400" />
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-green-400">{featuredSkin.trending.change}</div>
                    <div className="text-sm text-gray-400 mt-1">{featuredSkin.trending.volume} volume</div>
                  </div>
                </div>

                {/* LIVE MARKETPLACE PRICES */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Live Marketplace Prices</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
                          <span className="font-bold text-blue-400">S</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">Steam Market</div>
                          <div className="text-xs text-gray-400">Community Market</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-white">{featuredSkin.steamPrice}</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center">
                          <span className="font-bold text-green-400">B</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">Bitskins</div>
                          <div className="text-xs text-gray-400">Marketplace</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-white">{featuredSkin.lowestPrice}</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center">
                          <span className="font-bold text-purple-400">SP</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">Skinport</div>
                          <div className="text-xs text-gray-400">Marketplace</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-white">$73.45</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TWO COLUMN LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - Trending & Search */}
                <div className="lg:col-span-2 space-y-6">
                  {/* TRENDING SKINS */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-4 md:p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg md:text-xl font-bold text-white">Trending Skins</h3>
                      <button className="text-blue-400 text-sm font-medium hover:text-blue-300 flex items-center gap-1">
                        View all <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {trendingSkins.map((skin) => (
                        <div key={skin.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-700">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${
                              skin.trend === 'up' ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/10' : 'bg-gradient-to-br from-red-900/20 to-pink-900/10'
                            }`}>
                              <div className="text-sm md:text-base font-bold text-gray-300">
                                {skin.name.split(' ')[0].charAt(0)}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm md:text-base">{skin.name}</div>
                              <div className="text-xs md:text-sm text-gray-400">{skin.wear}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 md:gap-8">
                            <div className="text-right">
                              <div className="font-bold text-white text-sm md:text-base">{skin.price}</div>
                            </div>
                            
                            <div className={`text-right font-bold text-sm md:text-base ${
                              skin.trend === 'up' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {skin.change}
                              <div className="text-xs text-gray-400 font-normal">{skin.period}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Search & Best Deals */}
                <div className="space-y-6">
                  {/* SEARCH BOX */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-4 md:p-6 border border-gray-700">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-4">Search Skins</h3>
                    
                    <div className="relative mb-4">
                      <input
                        type="text"
                        className="search-input-dark"
                        placeholder="e.g., AK-47 Redline"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-300 mb-2 text-sm md:text-base">Popular Searches</h4>
                      <div className="flex flex-wrap gap-2">
                        {popularSkins.map((skin) => (
                          <button
                            key={skin}
                            onClick={() => handlePopularSearch(skin)}
                            className="popular-tag-dark"
                          >
                            {skin}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSearch}
                      disabled={loading || !query.trim()}
                      className="w-full py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Search size={16} />
                      {loading ? 'Searching...' : 'Search Prices'}
                    </button>
                  </div>

                  {/* BEST DEALS */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-4 md:p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <h3 className="text-lg md:text-xl font-bold text-white">Best Deals</h3>
                      <button className="text-blue-400 text-sm font-medium hover:text-blue-300 flex items-center gap-1">
                        View all <ChevronRight size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4">
                      {bestDeals.map((deal) => (
                        <div key={deal.id} className="p-3 md:p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/10 border border-blue-800/30 rounded-xl hover:shadow-lg transition-all hover:border-blue-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-white text-sm md:text-base">{deal.name}</div>
                            <span className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs font-medium rounded border border-blue-800/50">
                              {deal.market}
                            </span>
                          </div>
                          
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="text-lg md:text-xl font-bold text-white">{deal.price}</div>
                              <div className="text-xs md:text-sm text-gray-400 line-through">{deal.discount}</div>
                            </div>
                            
                            <div className="px-2 py-1 md:px-3 md:py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs md:text-sm font-medium rounded-full">
                              {deal.discountPercent} OFF
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTHER TABS (Favorites, Analytics, Twitter) */}
          {activeTab === "favorites" && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 text-center py-12 border border-gray-700">
              <div className="text-4xl mb-4">❤️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Favorites</h2>
              <p className="text-gray-400 mb-6">
                Save your favorite skins for quick access
              </p>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 text-center py-12 border border-gray-700">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-white mb-2">Analytics</h2>
              <p className="text-gray-400 mb-6">
                Advanced market analytics and insights
              </p>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {activeTab === "twitter" && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 text-center py-12 border border-gray-700">
              <div className="text-4xl mb-4">🐦</div>
              <h2 className="text-2xl font-bold text-white mb-2">Twitter Profiles</h2>
              <p className="text-gray-400 mb-6">
                Follow skin traders and market analysts
              </p>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </main>

        {/* MARKETPLACES INFO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="market-card-dark bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-800/30">
            <div className="text-xl md:text-2xl font-bold mb-1 md:mb-2 text-white">Steam</div>
            <div className="text-blue-300 text-sm">Community Market</div>
            <div className="mt-3 text-xs md:text-sm text-gray-400">https://steamcommunity.com/market</div>
          </div>
          
          <div className="market-card-dark bg-gradient-to-br from-green-900/20 to-emerald-800/10 border border-green-800/30">
            <div className="text-xl md:text-2xl font-bold mb-1 md:mb-2 text-white">Skinport</div>
            <div className="text-green-300 text-sm">Marketplace</div>
            <div className="mt-3 text-xs md:text-sm text-gray-400">https://skinport.com</div>
          </div>
          
          <div className="market-card-dark bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-800/30">
            <div className="text-xl md:text-2xl font-bold mb-1 md:mb-2 text-white">Bitskins</div>
            <div className="text-purple-300 text-sm">Marketplace</div>
            <div className="mt-3 text-xs md:text-sm text-gray-400">https://bitskins.com</div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-gray-300 font-medium text-sm md:text-base">Skin Price Aggregator © {new Date().getFullYear()}</p>
              <p className="text-gray-500 text-xs md:text-sm mt-1">
                Real-time prices from Steam, Skinport & Bitskins
              </p>
            </div>
            
            <div className="flex items-center gap-3 text-xs md:text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>API: <span className="text-gray-300">{healthStatus}</span></span>
              </div>
              <span className="hidden md:inline">•</span>
              <span>Updated: <span className="text-gray-300">{lastUpdated}</span></span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Refresh: <span className="text-gray-300">{refreshCount}</span></span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}