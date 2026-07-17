import { useState, useEffect } from 'react';
import sampleData from './sampleData.json';
import { Button } from './components/ui/button';
import { Sun, Moon } from 'lucide-react';

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestedNews, setSuggestedNews] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Separate into real and fake
    const fakes = sampleData.filter(item => item.label === 1);
    const reals = sampleData.filter(item => item.label === 0);

    // Shuffle arrays
    const shuffle = (array) => array.sort(() => 0.5 - Math.random());
    
    // Pick 10 of each
    const selectedFakes = shuffle([...fakes]).slice(0, 10);
    const selectedReals = shuffle([...reals]).slice(0, 10);
    
    // Combine and shuffle the final list so they are mixed
    const combined = shuffle([...selectedFakes, ...selectedReals]);
    setSuggestedNews(combined);
    
    // Initialize Dark Mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use VITE_API_URL for production, fallback to direct Flask port for local dev
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/predict';
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult({
        prediction: data.prediction,
        confidence: data.confidence
      });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex transition-colors duration-200">
      {/* Sidebar for Suggested News */}
      <aside className="w-80 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 h-screen overflow-y-auto hidden md:block transition-colors duration-200">
        <div className="p-4 bg-gray-100 dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 sticky top-0 transition-colors duration-200">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Suggested News</h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Click an article to test it</p>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
          {suggestedNews.map((news, idx) => (
            <li 
              key={idx} 
              className="p-4 hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              onClick={() => setText(news.title + "\n\n" + news.text)}
            >
              <h3 className="font-medium text-sm text-gray-800 dark:text-gray-100 line-clamp-2" title={news.title}>
                {news.title}
              </h3>
              <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                news.label_text === 'Real' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              }`}>
                Ground Truth: {news.label_text}
              </span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center py-10 px-4 h-screen overflow-y-auto relative">
        <div className="absolute top-4 right-4">
          <Button variant="outline" size="icon" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
        </div>

        <header className="mb-8 text-center max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">News Verifier</h1>
          </div>
          <p className="text-gray-600 dark:text-zinc-400 mt-2">
            Paste a news article (title and body) below or choose one from the sidebar to verify its authenticity.
          </p>
        </header>

        <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 p-6 rounded shadow-sm border border-gray-200 dark:border-zinc-800 transition-colors duration-200">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              className="w-full h-64 p-3 border border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-gray-100 rounded focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 resize-none text-gray-700 transition-colors duration-200"
              placeholder="Enter news text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            ></textarea>
            
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Check News'}
            </button>
          </form>

          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-4 text-center">
            Note: For optimal results, please choose news from the suggested sidebar. Highly professional AI-generated text or out-of-domain articles may be misclassified.
          </p>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded">
              Error: {error}
            </div>
          )}

          {result && (
            <div className={`mt-6 p-4 rounded border text-center font-bold text-lg ${
              result.prediction === 'Fake' 
                ? 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400 border-red-300 dark:border-red-900' 
                : 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border-green-300 dark:border-green-900'
            }`}>
              <div className="mb-2">Prediction: This article is likely {result.prediction.toUpperCase()}</div>
              
              {result.confidence && (
                <div className="w-full max-w-md mx-auto mt-3">
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span>Confidence Score</span>
                    <span>{result.confidence}%</span>
                  </div>
                  <div className="w-full bg-white dark:bg-zinc-950 bg-opacity-50 rounded-full h-2.5 border border-black dark:border-white border-opacity-10 dark:border-opacity-10">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-1000 ${result.prediction === 'Fake' ? 'bg-red-500' : 'bg-green-500'}`} 
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
