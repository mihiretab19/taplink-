import { supabase } from './supabase-client.js';
import { showToast } from './main.js';

let isSignUp = false;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('authForm');
  const toggleBtn = document.getElementById('toggleAuthMode');
  const title = document.getElementById('authTitle');
  const sub = document.getElementById('authSub');
  const submitBtn = document.getElementById('authSubmitBtn');

  // Check if already logged in
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      window.location.href = 'dashboard.html';
    }
  });

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;
    
    if (isSignUp) {
      title.textContent = 'Create Account';
      sub.textContent = 'Sign up to create your digital cards';
      submitBtn.textContent = 'Sign Up';
      toggleBtn.innerHTML = 'Sign In';
      toggleBtn.previousSibling.textContent = 'Already have an account? ';
    } else {
      title.textContent = 'Welcome Back';
      sub.textContent = 'Sign in to manage your digital cards';
      submitBtn.textContent = 'Sign In';
      toggleBtn.innerHTML = 'Sign Up';
      toggleBtn.previousSibling.textContent = "Don't have an account? ";
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showToast('Please enter email and password', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        
        // If email confirmation is enabled, session won't be active immediately
        if (data.user && data.session === null) {
          showToast('Sign up successful! Please check your email for a confirmation link.', 'info', 6000);
        } else {
          showToast('Account created and signed in!', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1000);
        }
        // Switch to sign in mode automatically
        if (!data.session) {
          toggleBtn.click();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        showToast('Signed in successfully!', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      }
    } catch (err) {
      showToast(err.message || 'Authentication error', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    }
  });
});

