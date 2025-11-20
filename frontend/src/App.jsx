import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { HomeScreen } from './components/HomeScreen';
import { ScanScreen } from './components/ScanScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { AnalysisScreen } from './components/AnalysisScreen';
import { RecommendationScreen } from './components/RecommendationScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { ChatbotFloat } from './components/ChatbotFloat';
import { Navbar } from './components/Navbar';
import { authAPI } from './utils/api';
import { BASE_URL } from './config';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [userName, setUserName] = useState('User');
  const [user, setUser] = useState(null);
  const [foodData, setFoodData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Example: Fetch food data from backend
  const fetchFoodData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/food`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch food data');
      }
      
      const data = await response.json();
      setFoodData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching food data:', error);
      setFoodData([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setUserName(JSON.parse(savedUser).name);
      setIsAuthenticated(true);
      setCurrentScreen('home');
    }
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response && response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        setUserName(response.data.user.name);
        setIsAuthenticated(true);
        setCurrentScreen('home');
        return { success: true };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Failed to connect to server. Please make sure backend is running.' };
    }
  };

  const handleSignup = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);
      if (response && response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        setUserName(response.data.user.name);
        setIsAuthenticated(true);
        setCurrentScreen('home');
        return { success: true };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message || 'Failed to connect to server. Please make sure backend is running.' };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserName('User');
    setIsAuthenticated(false);
    setCurrentScreen('login');
  };

  const handleScanStart = (imageUrl, analysisResult = null) => {
    setScannedImage(imageUrl);
    setAnalysisData(analysisResult);
    setCurrentScreen('processing');
    
    // Auto-transition to analysis after processing
    setTimeout(() => {
      setCurrentScreen('analysis');
    }, 3000);
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-yellow-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        {/* Show Navbar only when authenticated and not on login/signup */}
        {isAuthenticated && currentScreen !== 'login' && currentScreen !== 'signup' && (
          <Navbar 
            currentPage={currentScreen}
            onNavigate={setCurrentScreen}
            isDarkMode={isDarkMode}
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />
        )}

        {/* Screen Routing */}
        {currentScreen === 'login' && (
          <LoginScreen 
            onLogin={handleLogin}
            onNavigateToSignup={() => setCurrentScreen('signup')}
            isDarkMode={isDarkMode}
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />
        )}

        {currentScreen === 'signup' && (
          <SignupScreen 
            onSignup={handleSignup}
            onNavigateToLogin={() => setCurrentScreen('login')}
            isDarkMode={isDarkMode}
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onSetUserName={setUserName}
          />
        )}

        {currentScreen === 'home' && (
          <HomeScreen 
            onNavigate={setCurrentScreen}
            isDarkMode={isDarkMode}
            userName={userName}
          />
        )}

        {currentScreen === 'scan' && (
          <ScanScreen 
            onScanStart={handleScanStart}
            isDarkMode={isDarkMode}
          />
        )}

        {currentScreen === 'processing' && scannedImage && (
          <ProcessingScreen 
            imageUrl={scannedImage}
            isDarkMode={isDarkMode}
          />
        )}

        {currentScreen === 'analysis' && scannedImage && (
          <AnalysisScreen
            imageUrl={scannedImage}
            analysisData={analysisData}
            onNavigate={setCurrentScreen}
            isDarkMode={isDarkMode}
          />
        )}

        {currentScreen === 'recommendations' && (
          <RecommendationScreen
            onNavigate={setCurrentScreen}
            isDarkMode={isDarkMode}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            onNavigate={setCurrentScreen}
            isDarkMode={isDarkMode}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            onNavigate={setCurrentScreen}
            isDarkMode={isDarkMode}
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onLogout={handleLogout}
            userName={userName}
          />
        )}

        {/* Chatbot - show only when authenticated and NOT on chat page */}
        {isAuthenticated && currentScreen !== 'login' && currentScreen !== 'signup' && currentScreen !== 'recommendations' && (
          <ChatbotFloat />
        )}

        {/* Example: Display food data from API */}
        {isAuthenticated && currentScreen === 'home' && (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Food Data Example</h2>
              <button
                onClick={fetchFoodData}
                disabled={loading}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Fetch Food Data'}
              </button>
              {foodData.length > 0 && (
                <ul className="space-y-2">
                  {foodData.map((item, index) => (
                    <li key={index} className="p-3 bg-gray-100 dark:bg-slate-700 rounded">
                      <pre className="text-sm text-gray-800 dark:text-gray-200">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

