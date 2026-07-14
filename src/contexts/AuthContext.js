'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getAvatarColors } from '@/lib/utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load or create public user profile from auth user
  const loadUserProfile = async (authUser) => {
    try {
      // Try to find existing profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(profile);
        return profile;
      }

      // Create new profile from auth user data
      const colors = getAvatarColors();
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];
      const displayName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        '사용자';

      const { data: newProfile, error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          name: displayName,
          email: authUser.email,
          avatar_color: avatarColor,
        })
        .select()
        .single();

      if (error) {
        // If profile already exists (race condition), fetch it
        if (error.code === '23505') {
          const { data: existing } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
          setUser(existing);
          return existing;
        }
        throw error;
      }

      setUser(newProfile);
      return newProfile;
    } catch (error) {
      console.error('Load profile error:', error);
      // Fallback user from auth data
      const fallbackUser = {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '사용자',
        email: authUser.email,
        avatar_color: '#6366f1',
        created_at: new Date().toISOString(),
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  // Email + Password sign up
  const signUpWithEmail = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) throw error;

    // If email confirmation is disabled, user is immediately signed in
    if (data.user && data.session) {
      await loadUserProfile(data.user);
    }

    return data;
  };

  // Email + Password sign in
  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  // Sign out
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Update user profile
  const updateUser = async (updates) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updated = { ...user, ...data };
      setUser(updated);
    } catch (error) {
      console.error('Update user error:', error);
      const updated = { ...user, ...updates };
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUpWithEmail,
        signInWithEmail,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
