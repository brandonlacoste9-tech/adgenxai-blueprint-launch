import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuroraBackground from './AuroraBackground';

interface GoogleAuthProps {
  onAuthSuccess?: () => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onAuthSuccess }) => {
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user);
        onAuthSuccess?.();
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <AuroraBackground />

      <Card className="w-full max-w-md mx-4 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-voyageur-gold font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Welcome to Modern Voyageur
          </CardTitle>
          <p className="text-white/70 mt-2">
            Sign in with Google to access your creative studio
          </p>
        </CardHeader>

        <CardContent className="pt-0">
          <Auth
            supabaseClient={supabase}
            providers={['google']}
            redirectTo={`${window.location.origin}/studio`}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#d4af37',
                    brandAccent: '#FFD966',
                    brandButtonText: '#3d2b1f',
                    defaultButtonBackground: 'rgba(255, 255, 255, 0.05)',
                    defaultButtonBackgroundHover: 'rgba(255, 255, 255, 0.1)',
                    inputBackground: 'rgba(255, 255, 255, 0.05)',
                    inputBorder: 'rgba(255, 255, 255, 0.1)',
                    inputBorderHover: 'rgba(212, 175, 55, 0.5)',
                    inputBorderFocus: '#d4af37',
                  },
                  space: {
                    spaceSmall: '4px',
                    spaceMedium: '8px',
                    spaceLarge: '16px',
                    labelBottomMargin: '8px',
                    anchorBottomMargin: '4px',
                    emailInputSpacing: '4px',
                    socialAuthSpacing: '4px',
                    buttonPadding: '10px 15px',
                    inputPadding: '10px 15px',
                  },
                  fontSizes: {
                    baseBodySize: '13px',
                    baseInputSize: '14px',
                    baseLabelSize: '14px',
                    baseButtonSize: '14px',
                  },
                  radii: {
                    borderRadiusButton: '4px',
                    buttonBorderRadius: '4px',
                    inputBorderRadius: '4px',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
                input: 'auth-input',
                label: 'auth-label',
                message: 'auth-message',
                anchor: 'auth-anchor',
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign In',
                  loading_button_label: 'Signing In ...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: "Don't have an account? Sign up",
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign Up',
                  loading_button_label: 'Signing Up ...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleAuth;