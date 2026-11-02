import { supabase } from './supabase-client.js';
import { showToast } from './main.js';

const form = document.getElementById('resetPasswordForm');
const button = document.getElementById('resetPasswordBtn');
const status = document.getElementById('resetStatus');

function showError(message) {
  status.textContent = message;
  status.style.display = 'block';
}

async function requireRecoverySession() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user && !error) {
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 1500);
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || session?.user) {
          clearTimeout(timeout);
          data.subscription.unsubscribe();
          resolve();
        }
      });
    });
  }
  const { data: { user: recoveredUser }, error: recoveryError } = await supabase.auth.getUser();
  if (recoveryError || !recoveredUser) {
    showError('This password reset link is invalid or has expired. Request a new reset email.');
    button.disabled = true;
  }
}

requireRecoverySession();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.style.display = 'none';

  const password = document.getElementById('newPassword').value;
  const confirmation = document.getElementById('confirmPassword').value;
  if (password.length < 6) {
    showError('Password must be at least 6 characters.');
    return;
  }
  if (password !== confirmation) {
    showError('Passwords do not match.');
    return;
  }

  button.disabled = true;
  button.textContent = 'Updating...';
  try {
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw refreshError;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    await supabase.auth.signOut();
    showToast('Password updated. Sign in with your new password.', 'success');
    setTimeout(() => { window.location.replace('login.html'); }, 800);
  } catch (err) {
    console.error('Password update failed:', err);
    showError(err?.message || 'The password could not be updated.');
    button.disabled = false;
    button.textContent = 'Update password';
  }
});
