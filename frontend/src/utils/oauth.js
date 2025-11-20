// OAuth helper functions
import { BASE_URL } from '../config.js';

// Google OAuth - Using Google Identity Services
export const initGoogleSignIn = () => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: (response) => {
          resolve(response);
        },
      });
      
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large' }
      );
    } else {
      reject(new Error('Google Sign-In library not loaded'));
    }
  });
};

// Handle Google OAuth callback
export const handleGoogleSignIn = async () => {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Sign-In library not loaded'));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      callback: async (response) => {
        try {
          // Send credential to backend
          const backendResponse = await fetch(`${BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential: response.credential }),
          });

          const responseText = await backendResponse.text();
          if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            throw new Error('Backend server not running. Please start the server on port 5001.');
          }

          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            throw new Error('Invalid response from server. Backend might not be running.');
          }
          if (data.success) {
            // Store token
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
          }
          resolve(data);
        } catch (error) {
          console.error('Google sign-in error:', error);
          reject(error);
        }
      },
    });

    // Trigger sign-in
    window.google.accounts.id.prompt();
  });
};

// Apple Sign In
export const handleAppleSignIn = async () => {
  try {
    // Initialize Apple Sign In if not already done
    if (!window.AppleID) {
      throw new Error('Apple Sign In library not loaded');
    }

    window.AppleID.auth.init({
      clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
      scope: 'name email',
      redirectURI: window.location.origin,
      usePopup: true,
    });

    const response = await window.AppleID.auth.signIn();

    // Send to backend
    const backendResponse = await fetch(`${BASE_URL}/auth/apple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id_token: response.id_token,
        user: response.user 
      }),
    });

    const responseText = await backendResponse.text();
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error('Backend server not running. Please start the server on port 5001.');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid response from server. Backend might not be running.');
    }
    if (data.success) {
      // Store token
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  } catch (error) {
    console.error('Apple sign-in error:', error);
    throw error;
  }
};

