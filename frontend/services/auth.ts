import { User } from '../types';

const USE_MOCK_AUTH = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

// Mock storage for development
let mockCurrentUser: User | null = null;
let mockOTPCode = '123456';

// Helper to simulate delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Authentication Service (for development)
export const mockAuthService = {
  signInWithEmail: async (email: string): Promise<{ success: boolean; error?: string }> => {
    await delay();
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Invalid email address',
      };
    }
    
    // Generate random 6-digit OTP for this session
    mockOTPCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Mock OTP Code:', mockOTPCode); // For development only
    
    return { success: true };
  },
  
  confirmSignIn: async (email: string, code: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await delay();
    
    if (code !== mockOTPCode) {
      return {
        success: false,
        error: 'Invalid verification code',
      };
    }
    
    // Create mock user
    mockCurrentUser = {
      id: `user-${Date.now()}`,
      email,
      name: email.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    
    return {
      success: true,
      user: mockCurrentUser,
    };
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    await delay(100);
    return mockCurrentUser;
  },
  
  signOut: async (): Promise<void> => {
    await delay(100);
    mockCurrentUser = null;
  },
  
  getSession: async (): Promise<string | null> => {
    await delay(100);
    return mockCurrentUser ? `mock-token-${mockCurrentUser.id}` : null;
  },
};

// Real Amplify Authentication Service (for production)
export const amplifyAuthService = {
  signInWithEmail: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // TODO: Implement Amplify passwordless auth
      // const { nextStep } = await signIn({ username: email });
      // This will send OTP to email via Cognito
      
      return {
        success: false,
        error: 'Amplify auth not yet configured. Please set up Cognito User Pool.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send OTP',
      };
    }
  },
  
  confirmSignIn: async (email: string, code: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      // TODO: Implement Amplify OTP verification
      // const { isSignedIn } = await confirmSignIn({ challengeResponse: code });
      // const cognitoUser = await getCurrentUser();
      
      return {
        success: false,
        error: 'Amplify auth not yet configured. Please set up Cognito User Pool.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify OTP',
      };
    }
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    try {
      // TODO: Implement Amplify getCurrentUser
      // const { username, userId, signInDetails } = await getCurrentUser();
      
      return null;
    } catch (error) {
      return null;
    }
  },
  
  signOut: async (): Promise<void> => {
    try {
      // TODO: Implement Amplify signOut
      // await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },
  
  getSession: async (): Promise<string | null> => {
    try {
      // TODO: Implement Amplify getSession to get JWT token
      // const { tokens } = await fetchAuthSession();
      // return tokens?.accessToken?.toString() || null;
      
      return null;
    } catch (error) {
      return null;
    }
  },
};

// Export the appropriate service based on environment
const authService = USE_MOCK_AUTH ? mockAuthService : amplifyAuthService;

export const signInWithEmail = authService.signInWithEmail;
export const confirmSignIn = authService.confirmSignIn;
export const getCurrentUser = authService.getCurrentUser;
export const signOut = authService.signOut;
export const getSession = authService.getSession;

export default authService;

