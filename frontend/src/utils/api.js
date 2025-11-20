// API Configuration
import { BASE_URL } from '../config.js';
const API_BASE_URL = BASE_URL;

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Check if response is JSON
    let data;
    const contentType = response.headers.get('content-type') || '';
    
    // First, get response as text to check if it's HTML
    const responseText = await response.text();
    
    // Check if response is HTML (error page)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error('Backend server returned HTML instead of JSON. Please make sure backend server is running on port 5001.');
    }
    
    // Try to parse as JSON
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText.substring(0, 200));
      throw new Error(`Invalid JSON response from server. Backend might not be running. Response: ${responseText.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        const errorMsg = data.error || data.message || 'Invalid or expired token';
        console.error('401 Unauthorized:', errorMsg);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error(errorMsg);
      }
      
      throw new Error(data.error || data.message || `API request failed (${response.status})`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    
    // Network error handling
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Backend server is not running. Please start the server on port 5001.');
    }
    
    // Re-throw with better message
    if (error.message) {
      throw error;
    }
    
    throw new Error('Network error. Please check if backend server is running on port 5001.');
  }
}

// Food Analysis API
export const foodAnalysisAPI = {
  analyze: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/food-analysis/analyze`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    // Check if response is HTML
    const responseText = await response.text();
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error('Backend server returned HTML. Please make sure backend is running on port 5001.');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid response from server. Backend might not be running.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze food');
    }
    return data;
  },

  analyzeMock: async () => {
    return apiCall('/food-analysis/analyze-mock', {
      method: 'POST',
    });
  },
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: async (message, conversationHistory = []) => {
    return apiCall('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    });
  },

  getSuggestions: async () => {
    return apiCall('/chatbot/suggestions');
  },
};

// Auth API
export const authAPI = {
  register: async (name, email, password) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  login: async (email, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};

// Meals API
export const mealsAPI = {
  getHistory: async () => {
    return apiCall('/meals/history');
  },

  addMeal: async (mealData) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('You must be logged in to save meals. Please login first.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/meals/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(mealData),
      });

      // Check if response is HTML
      const responseText = await response.text();
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error('Backend server returned HTML. Please make sure backend is running on port 5001.');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response:', responseText.substring(0, 200));
        throw new Error('Invalid response from server. Backend might not be running.');
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to save meal');
      }
      
      return data;
    } catch (error) {
      console.error('Add meal error:', error);
      if (error.message) {
        throw error;
      }
      throw new Error('Failed to save meal. Please try again.');
    }
  },

  getStats: async () => {
    return apiCall('/meals/stats');
  },
};

export default {
  foodAnalysisAPI,
  chatbotAPI,
  authAPI,
  mealsAPI,
};

