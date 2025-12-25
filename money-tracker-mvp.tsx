import React, { useState } from 'react';
import { Upload, TrendingDown, PieChart, BarChart3, Shield, Zap, Lock, Download, Sparkles, ArrowUpRight, ArrowDownRight, Calendar, AlertCircle } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const App = () => {
  const [view, setView] = useState('landing');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (uploadedFile) => {
    setFile(uploadedFile);
    setView('processing');
    setError(null);
    
    try {
      // Step 1: Convert PDF/Image to base64
      setProcessingStep('Converting file to base64...');
      const base64Data = await fileToBase64(uploadedFile);
      
      // Step 2: Extract text using Claude API
      setProcessingStep('Extracting text with AI OCR...');
      const extractedText = await extractTextWithClaude(base64Data, uploadedFile.type);
      
      if (!extractedText || extractedText.length < 50) {
        throw new Error('Could not extract readable text from the document. Please ensure it\'s a clear bank statement.');
      }
      
      // Step 3: Parse transactions and analyze
      setProcessingStep('Analyzing transactions with AI...');
      const analysis = await analyzeTransactions(extractedText);
      
      setAnalysisData(analysis);
      setView('dashboard');
      
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process document. Please try again.');
      setView('landing');
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractTextWithClaude = async (base64Data, mimeType) => {
    const mediaType = mimeType.includes('pdf') ? 'application/pdf' : 
                     mimeType.includes('png') ? 'image/png' :
                     mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'image/jpeg' : 'image/png';

    const contentType = mimeType.includes('pdf') ? 'document' : 'image';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: contentType,
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data
              }
            },
            {
              type: 'text',
              text: `Extract ALL transaction data from this bank statement. Return the raw text with dates, descriptions, and amounts. Include everything - don't skip any transactions.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  };

  const analyzeTransactions = async (extractedText) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are a financial analyst. Analyze these bank statement transactions and return ONLY valid JSON.

Extracted text:
${extractedText}

Return JSON with this EXACT structure (no additional text):
{
  "transactions": [{"date":"2024-11-15","description":"Amazon","amount":1234.50,"type":"debit"}],
  "categorized": [{"id":0,"category":"Shopping","merchant":"Amazon","confidence":0.95}],
  "insights": ["You spent 40% on food delivery", "Weekend spending is 2.5x higher", "Unusual transaction detected"],
  "top_merchants": [{"name":"Swiggy","total":5600}],
  "category_totals": {"Food & Dining":5600,"Shopping":12000,"Transport":3000,"Entertainment":2000,"Other":1000},
  "anomalies": [{"date":"2024-11-12","amount":8000,"reason":"3x your average"}],
  "total_spent": 45600,
  "total_income": 65000,
  "savings_rate": 68,
  "biggest_transaction": 8000,
  "top_category": "Food & Dining",
  "food_delivery": {
    "swiggy": 0,
    "zomato": 0,
    "total": 0
  },
  "quick_commerce": {
    "zepto": 0,
    "blinkit": 0,
    "instamart": 0,
    "total": 0
  }
}

Categories: Food & Dining, Shopping, Transport, Entertainment, Bills & Utilities, Healthcare, Transfers, Subscriptions, Cash Withdrawal, Salary/Income, Other

Rules:
- Return ONLY the JSON object, no markdown, no explanation
- Extract ALL transactions you can find
- Categorize each transaction
- Calculate totals accurately
- Generate 3 specific insights based on actual data
- Identify top 5-10 merchants
- Flag transactions >2x average as anomalies
- IMPORTANT: Separately track Swiggy, Zomato, Zepto, Blinkit, and Instamart spending in the food_delivery and quick_commerce objects`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Analysis API error: ${response.status}`);
    }

    const data = await response.json();
    let jsonText = data.content[0].text;
    
    // Clean up response
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(jsonText);
    
    // Transform for charts
    const categoryData = Object.entries(parsed.category_totals).map(([name, value]) => {
      const colors = {
        'Food & Dining': '#1DB954',
        'Shopping': '#1ED760',
        'Transport': '#1FDF64',
        'Entertainment': '#3BE477',
        'Bills & Utilities': '#2EBD59',
        'Healthcare': '#4AE489',
        'Other': '#535353'
      };
      const total = parsed.total_spent;
      return {
        name,
        value,
        percentage: Math.round((value / total) * 100),
        color: colors[name] || '#535353'
      };
    }).filter(item => item.value > 0);

    // Time series data from transactions
    const transactionsByDate = {};
    parsed.transactions.forEach(t => {
      if (t.type === 'debit') {
        const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        transactionsByDate[date] = (transactionsByDate[date] || 0) + t.amount;
      }
    });
    
    const timeSeriesData = Object.entries(transactionsByDate)
      .map(([date, amount]) => ({ date, amount: Math.round(amount) }))
      .slice(0, 10);

    return {
      ...parsed,
      categoryData,
      timeSeriesData,
      merchantData: parsed.top_merchants.slice(0, 5)
    };
  };

  // Landing Page
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-black to-black"></div>

        <nav className="relative z-10 px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-bold text-white">SpendSense</span>
          </div>
          <button className="px-6 py-3 bg-transparent text-white rounded-full hover:scale-105 transition-transform font-semibold border border-white/20 hover:border-white/40">
            Log in
          </button>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-8 pt-24 pb-32">
          <div className="text-center mb-20">
            <h1 className="text-7xl md:text-8xl font-black text-white mb-6 leading-tight tracking-tight">
              Where Is My<br />
              <span className="text-[#1DB954]">Money Going?</span>
            </h1>
            
            <p className="text-2xl text-gray-400 mb-16 max-w-2xl mx-auto font-light">
              Upload your bank statement. Get instant AI insights.<br />
              No login required.
            </p>

            {error && (
              <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <div className="max-w-2xl mx-auto">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-16 transition-all ${
                  dragActive 
                    ? 'border-[#1DB954] bg-[#1DB954]/5' 
                    : 'border-gray-800 bg-[#121212] hover:bg-[#181818]'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.heic"
                  onChange={handleChange}
                />
                
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 bg-[#1DB954] rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <Upload className="w-12 h-12 text-black" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white mb-3">
                        Choose file or drag it here
                      </p>
                      <p className="text-gray-400 text-lg">
                        PDF, PNG, JPG • Max 10MB
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-8 mt-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 bg-[#1DB954]/10 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-[#1DB954]" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No login needed</p>
                </div>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 bg-[#1DB954]/10 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[#1DB954]" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Auto-deleted in 2h</p>
                </div>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 bg-[#1DB954]/10 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#1DB954]" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Real AI analysis</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-32">
            <div className="bg-[#181818] rounded-xl p-8 hover:bg-[#282828] transition-colors">
              <PieChart className="w-12 h-12 text-[#1DB954] mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Smart Categories</h3>
              <p className="text-gray-400 leading-relaxed">AI groups your spending into meaningful categories automatically</p>
            </div>
            <div className="bg-[#181818] rounded-xl p-8 hover:bg-[#282828] transition-colors">
              <BarChart3 className="w-12 h-12 text-[#1DB954] mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Merchant Insights</h3>
              <p className="text-gray-400 leading-relaxed">See exactly where your money goes, merchant by merchant</p>
            </div>
            <div className="bg-[#181818] rounded-xl p-8 hover:bg-[#282828] transition-colors">
              <Sparkles className="w-12 h-12 text-[#1DB954] mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Honest AI</h3>
              <p className="text-gray-400 leading-relaxed">Get blunt, actionable insights about your spending patterns</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Processing View
  if (view === 'processing') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-2xl px-8">
          <div className="w-32 h-32 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Sparkles className="w-16 h-16 text-black" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Analyzing Your Statement</h2>
          <p className="text-gray-400 mb-12 text-xl">AI is reading your transactions...</p>
          <div className="bg-[#181818] rounded-xl p-6 mb-8">
            <p className="text-[#1DB954] text-lg">{processingStep}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 text-gray-300">
              <div className="w-3 h-3 bg-[#1DB954] rounded-full animate-pulse"></div>
              <span className="text-lg">Extracting text with OCR</span>
            </div>
            <div className="flex items-center gap-4 text-gray-300">
              <div className="w-3 h-3 bg-[#1DB954] rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span className="text-lg">Categorizing transactions with AI</span>
            </div>
            <div className="flex items-center gap-4 text-gray-300">
              <div className="w-3 h-3 bg-[#1DB954] rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <span className="text-lg">Generating insights</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (!analysisData) return null;

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="min-h-screen bg-black">
      <nav className="px-8 py-6 flex justify-between items-center bg-[#121212] sticky top-0 z-50 border-b border-[#282828]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-bold text-white">SpendSense</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('landing')}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            New Analysis
          </button>
          <button className="px-8 py-3 bg-[#1DB954] text-black rounded-full hover:scale-105 transition-transform font-bold">
            Upgrade
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <Calendar className="w-8 h-8 text-[#1DB954]" />
            <h1 className="text-5xl font-black text-white">{monthName} Spending</h1>
          </div>
          <p className="text-gray-400 text-xl">Analysis based on your bank statement</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-[#181818] rounded-xl p-6 hover:bg-[#282828] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Total Spent</span>
              <ArrowDownRight className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-4xl font-black text-white mb-2">₹{analysisData.total_spent?.toLocaleString() || 0}</p>
            <p className="text-xs text-gray-500">This period</p>
          </div>

          <div className="bg-[#181818] rounded-xl p-6 hover:bg-[#282828] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Top Category</span>
              <PieChart className="w-5 h-5 text-[#1DB954]" />
            </div>
            <p className="text-2xl font-black text-white mb-2">{analysisData.top_category || 'N/A'}</p>
            <p className="text-xs text-gray-500">{analysisData.categoryData?.[0]?.percentage || 0}% of spending</p>
          </div>

          <div className="bg-[#181818] rounded-xl p-6 hover:bg-[#282828] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Biggest</span>
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-4xl font-black text-white mb-2">₹{analysisData.biggest_transaction?.toLocaleString() || 0}</p>
            <p className="text-xs text-gray-500">Single transaction</p>
          </div>

          <div className="bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-xl p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <span className="text-black text-sm font-semibold uppercase tracking-wider">Savings Rate</span>
              <ArrowUpRight className="w-5 h-5 text-black" />
            </div>
            <p className="text-4xl font-black text-black mb-2">{analysisData.savings_rate || 0}%</p>
            <p className="text-xs text-black/70">{analysisData.savings_rate > 50 ? 'Great job!' : 'Keep saving!'}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#181818] rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-8">Category Breakdown</h3>
            {analysisData.categoryData && analysisData.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <RePieChart>
                  <Pie
                    data={analysisData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analysisData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-20">No category data available</p>
            )}
          </div>

          <div className="bg-[#181818] rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-8">Top Merchants</h3>
            {analysisData.merchantData && analysisData.merchantData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analysisData.merchantData}>
                  <XAxis dataKey="name" stroke="#b3b3b3" />
                  <YAxis stroke="#b3b3b3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
                  <Bar dataKey="total" fill="#1DB954" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-20">No merchant data available</p>
            )}
          </div>
        </div>

        {analysisData.timeSeriesData && analysisData.timeSeriesData.length > 0 && (
          <div className="bg-[#181818] rounded-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-white mb-8">Spending Over Time</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={analysisData.timeSeriesData}>
                <XAxis dataKey="date" stroke="#b3b3b3" />
                <YAxis stroke="#b3b3b3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121212',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Line type="monotone" dataKey="amount" stroke="#1DB954" strokeWidth={4} dot={{ fill: '#1DB954', r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Food Delivery & Quick Commerce Section */}
        {((analysisData.food_delivery?.total > 0) || (analysisData.quick_commerce?.total > 0)) && (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Food Delivery Apps */}
            {analysisData.food_delivery?.total > 0 && (
              <div className="bg-[#181818] rounded-xl p-8 border-2 border-[#FF6B6B]/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">🍔 Food Delivery Apps</h3>
                  <div className="text-right">
                    <p className="text-3xl font-black text-[#FF6B6B]">₹{analysisData.food_delivery.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Total spent</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {analysisData.food_delivery.swiggy > 0 && (
                    <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg hover:bg-[#1a1a1a] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white">S</div>
                        <span className="text-white font-semibold">Swiggy</span>
                      </div>
                      <span className="text-xl font-bold text-white">₹{analysisData.food_delivery.swiggy.toLocaleString()}</span>
                    </div>
                  )}
                  {analysisData.food_delivery.zomato > 0 && (
                    <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg hover:bg-[#1a1a1a] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white">Z</div>
                        <span className="text-white font-semibold">Zomato</span>
                      </div>
                      <span className="text-xl font-bold text-white">₹{analysisData.food_delivery.zomato.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Commerce Apps */}
            {analysisData.quick_commerce?.total > 0 && (
              <div className="bg-[#181818] rounded-xl p-8 border-2 border-[#4ECDC4]/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">⚡ Quick Commerce</h3>
                  <div className="text-right">
                    <p className="text-3xl font-black text-[#4ECDC4]">₹{analysisData.quick_commerce.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Total spent</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {analysisData.quick_commerce.zepto > 0 && (
                    <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg hover:bg-[#1a1a1a] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-white">Z</div>
                        <span className="text-white font-semibold">Zepto</span>
                      </div>
                      <span className="text-xl font-bold text-white">₹{analysisData.quick_commerce.zepto.toLocaleString()}</span>
                    </div>
                  )}
                  {analysisData.quick_commerce.blinkit > 0 && (
                    <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg hover:bg-[#1a1a1a] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center font-bold text-black">B</div>
                        <span className="text-white font-semibold">Blinkit</span>
                      </div>
                      <span className="text-xl font-bold text-white">₹{analysisData.quick_commerce.blinkit.toLocaleString()}</span>
                    </div>
                  )}
                  {analysisData.quick_commerce.instamart > 0 && (
                    <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg hover:bg-[#1a1a1a] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center font-bold text-white">I</div>
                        <span className="text-white font-semibold">Instamart</span>
                      </div>
                      <span className="text-xl font-bold text-white">₹{analysisData.quick_commerce.instamart.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-gradient-to-br from-[#1DB954]/10 to-transparent border border-[#1DB954]/20 rounded-xl p-10">
          <div className="flex items-center gap-4 mb-8">
            <Sparkles className="w-8 h-8 text-[#1DB954]" />
            <h3 className="text-3xl font-black text-white">AI Insights</h3>
          </div>
          <div className="space-y-6">
            {analysisData.insights && analysisData.insights.length > 0 ? (
              analysisData.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-[#1DB954] rounded-full mt-3"></div>
                  <p className="text-xl text-gray-300">{insight}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No insights generated</p>
            )}
          </div>
          
          <div className="mt-10 pt-10 border-t border-[#282828]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-xl mb-2">Want to track this over time?</p>
                <p className="text-gray-400 text-lg">Upgrade for monthly comparisons and detailed reports</p>
              </div>
              <button className="px-10 py-4 bg-[#1DB954] text-black rounded-full hover:scale-105 transition-transform font-black text-lg flex items-center gap-3">
                Upgrade Now
                <ArrowUpRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;