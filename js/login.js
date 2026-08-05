import { supabase } from './supabase-client.js';
import { showToast } from './main.js';

let isSignUp = false;
let disposableDomains = {};

const FALLBACK_DISPOSABLE = [
  'mailinator.com', 'yopmail.com', 'tempmail.com', '10minutemail.com', 
  'trashmail.com', 'sharklasers.com', 'guerillamail.com', 'guerillamailblock.com', 
  'guerillamail.net', 'guerillamail.org', 'guerillamail.biz', 'grr.la', 
  'pokemail.net', 'dispostable.com', 'getairmail.com', 'generator.email', 
  'throwawaymail.com', 'temp-mail.org', 'fakeinbox.com', 'maildrop.cc',
  'amupx.com', 'davopa.com', 'bora4d.com', 'bejum.com', 'aghism.com', 'applamos.com'
];

async function loadDisposableDomains() {
  try {
    const cached = localStorage.getItem('disposable_domains_cache');
    const cachedTime = localStorage.getItem('disposable_domains_time');
    const oneDay = 24 * 60 * 60 * 1000;

    if (cached && cachedTime && (Date.now() - Number(cachedTime) < oneDay)) {
      disposableDomains = JSON.parse(cached);
      return;
    }

    const res = await fetch('https://raw.githubusercontent.com/7c/fakefilter/main/json/data.json');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    if (data && data.domains) {
      disposableDomains = data.domains;
      localStorage.setItem('disposable_domains_cache', JSON.stringify(data.domains));
      localStorage.setItem('disposable_domains_time', Date.now().toString());
    }
  } catch (err) {
    console.warn('Could not fetch updated disposable email list, using fallback:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDisposableDomains();
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

      // Block temporary/disposable email addresses
      const domain = email.split('@')[1]?.toLowerCase() || '';
      let isDisposable = false;
      if (Object.keys(disposableDomains).length > 0) {
        isDisposable = !!disposableDomains[domain];
      } else {
        isDisposable = FALLBACK_DISPOSABLE.some(d => domain === d || domain.endsWith('.' + d));
      }
      if (isDisposable) {
        showToast('Temporary/disposable email addresses are not allowed.', 'error');
        return;
      }
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

