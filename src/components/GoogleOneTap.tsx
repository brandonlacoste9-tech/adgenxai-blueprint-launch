import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleOneTapProps {
  onAuthSuccess?: () => void;
  onAuthError?: (error: any) => void;
}

const GoogleOneTap: React.FC<GoogleOneTapProps> = ({ onAuthSuccess, onAuthError }) => {
  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        // Initialize Google One Tap
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID', // You'll need to add this
          callback: handleCredentialResponse,
          auto_select: true, // Automatically select the account if only one is signed in
          cancel_on_tap_outside: false,
          context: 'signin',
        });

        // Display the One Tap UI
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to regular auth
            console.log('One Tap not displayed, using fallback auth');
          }
        });
      }
    };

    return () => {
      // Cleanup
      if (window.google && window.google.accounts) {
        window.google.accounts.id.cancel();
      }
      document.head.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      // Exchange the Google ID token for a Supabase session
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        onAuthError?.(error);
      } else {
        console.log('Successfully signed in with Google One Tap:', data);
        onAuthSuccess?.();
      }
    } catch (error) {
      console.error('Error during Google One Tap auth:', error);
      onAuthError?.(error);
    }
  };

  // This component doesn't render anything visible - it's just for the One Tap functionality
  return null;
};

export default GoogleOneTap;