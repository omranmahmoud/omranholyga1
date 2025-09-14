import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState<'prompt'|'granted'|'denied'>('prompt');
  const [socialError, setSocialError] = useState<string | null>(null);
  const { login, user, loginWithProvider } = useAuth();
  const { settings } = useStore();
  const navigate = useNavigate();
  // const location = useLocation(); // future: redirect after login

  // const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    // Check for existing geolocation permission
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setLocationStatus(result.state);
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setLocationStatus(result.state);
          });
        })
        .catch(() => {
          // Fallback if permissions API is not supported
          setLocationStatus('prompt');
        });
    }
    // Initialize Google Identity Services if enabled
    if (settings?.googleAuth?.enabled && !(window as any).google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        try {
          const gid = (window as any).google?.accounts?.id;
      if (gid && settings?.googleAuth?.clientId) {
            gid.initialize({
        client_id: settings.googleAuth.clientId,
              callback: async (response: any) => {
                const idToken = response.credential;
                if (!idToken) return;
                try {
                  await loginWithProvider('google', { idToken });
                  navigate('/store');
                } catch (e:any) {
                  const msg = e?.response?.data?.message || 'Google login failed';
                  setSocialError(msg);
                }
              }
            });
            // Optionally render button placeholder if desired
            const btnContainer = document.getElementById('google-signin-btn');
            if (btnContainer) {
              gid.renderButton(btnContainer, { theme: 'outline', size: 'large', width: 320 });
            }
          }
        } catch (e) {
          console.warn('Google Identity init failed', e);
        }
      };
      document.head.appendChild(script);
    }
  }, [settings?.googleAuth?.enabled, settings?.googleAuth?.clientId, loginWithProvider, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login({ email, password });
      // Use user from context after login
      if (user && user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/store', { replace: true });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLocationPermission = () => {
    // Open browser settings for the current origin
    if (window.location.protocol === 'https:') {
      window.open('chrome://settings/content/location', '_blank');
    } else {
      // For development environment
  toast('Please enable location services in your browser settings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Lock className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Location Permission Warning */}
          {locationStatus === 'denied' && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Location Access Blocked
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Location access has been blocked. Some features like automatic currency selection may not work properly.
                    </p>
                    <button
                      onClick={handleResetLocationPermission}
                      className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                    >
                      Enable Location Access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {(settings?.googleAuth?.enabled || settings?.facebookAuth?.enabled) && (
            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              <div className="space-y-3">
    {settings?.googleAuth?.enabled && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
      setSocialError(null);
                        // Expect Google Identity Services loaded globally (gsi script). Fallback: prompt user for token.
                        if ((window as any).google?.accounts?.id) {
                          (window as any).google.accounts.id.prompt();
                          toast('If not auto-signed, use the rendered button below.');
                        } else {
                          const manual = prompt('Enter Google ID token (for dev testing)');
                          if (!manual) return;
                          await loginWithProvider('google', { idToken: manual });
                          navigate('/store');
                        }
                      } catch (e:any) {
      const msg = e.response?.data?.message || e.message || 'Google login failed';
      setSocialError(msg);
      toast.error(msg);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    <img src="https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png" alt="Google" className="w-5 h-5" />
                    Continue with Google
                  </button>
                )}
                {settings?.googleAuth?.enabled && (
                  <div id="google-signin-btn" className="flex justify-center" />
                )}
                {settings?.facebookAuth?.enabled && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setSocialError(null);
                        // If FB SDK loaded
                        if ((window as any).FB) {
                          (window as any).FB.login(async (response: any) => {
                            if (response.authResponse) {
                              const { accessToken, userID } = response.authResponse;
                              const resp = await api.postWithRetry('/auth/facebook', { accessToken, userID });
                              localStorage.setItem('token', resp.data.token);
                              toast.success('Signed in with Facebook');
                              navigate('/store');
                            } else {
                              toast.error('Facebook login cancelled');
                            }
                          }, { scope: 'email,public_profile' });
                        } else {
                          const manual = prompt('Enter Facebook access token (for dev testing)');
                          if (!manual) return;
                          const resp = await api.postWithRetry('/auth/facebook', { accessToken: manual });
                          localStorage.setItem('token', resp.data.token);
                          toast.success('Signed in with Facebook');
                          navigate('/store');
                        }
                      } catch (e:any) {
                        const msg = e.response?.data?.message || e.message || 'Facebook login failed';
                        setSocialError(msg);
                        toast.error(msg);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-[#1877F2] hover:bg-[#1464c7] text-sm font-medium text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24h11.495v-9.294H9.847v-3.622h2.974V8.413c0-2.943 1.796-4.548 4.416-4.548 1.255 0 2.336.093 2.65.135v3.07l-1.82.001c-1.428 0-1.705.679-1.705 1.674v2.194h3.406l-.444 3.622h-2.962V24h5.807C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0z"/></svg>
                    Continue with Facebook
                  </button>
                )}
              </div>
              {socialError && (
                <div className="mt-4 p-3 border border-red-300 bg-red-50 text-sm text-red-700 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Social login failed</p>
                    <p>{socialError}</p>
                    <button type="button" onClick={() => setSocialError(null)} className="mt-1 text-xs underline text-red-600">Dismiss</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Demo credentials
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>Email: admin@example.com</div>
              <div>Password: admin123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}