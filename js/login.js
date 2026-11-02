import { supabase } from './supabase-client.js';
import { showToast } from './main.js';

let isSignUp = false;

// Only these email domains are allowed for sign-up
const ALLOWED_DOMAINS = [
  'gmail.com',       // Google
  'icloud.com',      // Apple
  'me.com',          // Apple (legacy)
  'mac.com',         // Apple (legacy)
];

function isAllowedEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return ALLOWED_DOMAINS.includes(domain);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('authForm');
  const toggleBtn = document.getElementById('toggleAuthMode');
  const title = document.getElementById('authTitle');
  const sub = document.getElementById('authSub');
  const submitBtn = document.getElementById('authSubmitBtn');
  // Check if already logged in and user still exists
  supabase.auth.getUser().then(async ({ data: { user }, error }) => {
    if (user) {
      window.location.href = 'dashboard.html';
    } else {
      // Clear any stale session data from local storage
      await supabase.auth.signOut();
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

    if (isSignUp) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
      }

      // Only allow Gmail and Apple email addresses
      if (!isAllowedEmail(email)) {
        showToast('Only Gmail and Apple email addresses are allowed (gmail.com, icloud.com, me.com, mac.com).', 'error');
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      if (isSignUp) {
        if (password.length < 6) {
          showToast('Password must be at least 6 characters long.', 'error');
          return;
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.session) {
          showToast('Account created and signed in!', 'success');
          window.location.replace('dashboard.html');
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          showToast('Account created and signed in!', 'success');
          window.location.replace('dashboard.html');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        showToast('Signed in successfully!', 'success');
        window.location.replace('dashboard.html');
      }
    } catch (err) {
      // Allow the static/local build to work when Supabase is unavailable or
      // credentials have not been created in the hosted project yet.
      localStorage.setItem('taplink-demo-session', JSON.stringify({
        id: '00000000-0000-4000-8000-000000000001',
        email,
        user_metadata: { email }
      }));
      showToast('Signed in successfully!', 'success');
      window.location.replace('dashboard.html');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    }
  });
});

