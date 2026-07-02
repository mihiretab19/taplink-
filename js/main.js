// ============================================================
// TAPLINK — MAIN JS (Utilities, Supabase helpers, toasts)
// ============================================================

import { supabase } from './supabase-client.js';

// ── Toast System ──────────────────────────────────────────
export function showToast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
window.showToast = showToast;

// ── Supabase Database Helpers ──────────────────────────────
export async function getCards() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data.map(row => ({ ...row.card_data, id: row.id }));
  } catch (err) {
    console.error('Error fetching cards:', err);
    return [];
  }
}
window.getCards = getCards;

export async function getCard(id) {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return { ...data.card_data, id: data.id };
  } catch (err) {
    console.error('Error fetching card:', err);
    return null;
  }
}
window.getCard = getCard;

export async function saveCard(card) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('You must be logged in to save cards', 'error');
      throw new Error('Not logged in');
    }

    if (!card.id) {
      card.id = generateId();
    }

    const payload = {
      id: card.id,
      user_id: user.id,
      card_data: card
    };

    const { data, error } = await supabase
      .from('cards')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return { ...data.card_data, id: data.id };
  } catch (err) {
    console.error('Error saving card:', err);
    throw err;
  }
}
window.saveCard = saveCard;

export async function deleteCard(id) {
  try {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (err) {
    console.error('Error deleting card:', err);
    throw err;
  }
}
window.deleteCard = deleteCard;

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
window.generateId = generateId;

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
window.getUser = getUser;

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}
window.signOut = signOut;

// ── Scroll Reveal ─────────────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });

  els.forEach(el => {
    // Immediately reveal elements already in viewport on load
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    } else {
      observer.observe(el);
    }
  });
}
window.initScrollReveal = initScrollReveal;

// ── Nav Scroll Effect ─────────────────────────────────────
function initNavScroll() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}
window.initNavScroll = initNavScroll;

// ── Hamburger ─────────────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}
window.initHamburger = initHamburger;

// ── Modal helpers ─────────────────────────────────────────
export function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}
window.openModal = openModal;

export function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
}
window.closeModal = closeModal;

// ── XSS Sanitization Utilities ───────────────────────────
/**
 * Escapes HTML special characters in user-supplied strings.
 * Apply to ALL user data inserted into innerHTML.
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
    .replace(/`/g,  '&#x60;');
}
window.escapeHtml = escapeHtml;

/**
 * Sanitizes URLs to block javascript: and data:text protocol injection.
 * Use on all href/src values that come from user input.
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim().toLowerCase();
  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:text') ||
    trimmed.startsWith('vbscript:')
  ) return '#';
  // Auto-prefix bare URLs
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('tel:') &&
    !trimmed.startsWith('mailto:') &&
    !trimmed.startsWith('/')
  ) return `https://${url.trim()}`;
  return url.trim();
}
window.sanitizeUrl = sanitizeUrl;

/**
 * Auto-formats user text fields:
 * - Trims whitespace
 * - Collapses multiple spaces
 * - Removes space before punctuation
 * - Optionally title-cases the result
 */
export function cleanTextField(value, titleCase = false) {
  if (!value || typeof value !== 'string') return '';
  let v = value
    .trim()
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,\.!?:;])/g, '$1');
  if (titleCase) v = v.replace(/\b\w/g, (c) => c.toUpperCase());
  return v;
}
window.cleanTextField = cleanTextField;

// ── Image Compression + Base64 ────────────────────────────
/**
 * Compresses an image file to under maxKB using canvas, then
 * returns a base64 data URL. Replaces the old bare FileReader approach.
 * Prevents oversized images from bloating the JSONB card_data column.
 */
export function fileToBase64(file, maxKB = 200, maxDimension = 800) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image')); return;
    }
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // Scale down to maxDimension while preserving aspect ratio
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height / width) * maxDimension);
            width  = maxDimension;
          } else {
            width  = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        // Binary search for best JPEG quality that stays under maxKB
        let lo = 0.1, hi = 0.95, quality = 0.8, dataUrl;
        for (let i = 0; i < 8; i++) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          const sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
          if (sizeKB > maxKB) hi = quality; else lo = quality;
          quality = (lo + hi) / 2;
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
window.fileToBase64 = fileToBase64;

// ── vCard Generator (Hardened against vCard injection) ────
/**
 * Sanitizes vCard field values by stripping CR/LF characters
 * (the primary vCard injection vector) and escaping RFC 6350
 * special characters: \ ; ,
 */
function sanitizeVCardField(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/[\r\n\0]/g, ' ')  // Strip CR, LF, null — core injection vector
    .replace(/\\/g, '\\\\')
    .replace(/;/g,  '\\;')
    .replace(/,/g,  '\\,')
    .trim();
}

export function generateVCard(card) {
  const {
    name = '', title = '', company = '', phone = '', email = '',
    website = '', location = '', avatar = '', social = {}
  } = card;

  // Sanitize every text field before writing into vCard
  const safeName    = sanitizeVCardField(name);
  const safeTitle   = sanitizeVCardField(title);
  const safeCompany = sanitizeVCardField(company);
  const safePhone   = phone.replace(/[^\d\+\(\)\-\s]/g, '');
  const safeEmail   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
  const safeWebsite = /^https?:\/\//i.test(website) ? website : '';
  const safeLocation= sanitizeVCardField(location);

  // Split name into First / Last for the N: field
  const nameParts = safeName.split(' ');
  const firstName  = sanitizeVCardField(nameParts[0] || '');
  const lastName   = sanitizeVCardField(nameParts.slice(1).join(' ') || '');

  let photoLine = '';
  if (avatar && avatar.startsWith('data:image')) {
    const b64 = avatar.split(',')[1];
    // Validate it is a clean base64 string (no injection)
    if (b64 && /^[A-Za-z0-9+/=\r\n]+$/.test(b64)) {
      const ext = avatar.includes('png') ? 'PNG' : 'JPEG';
      photoLine = `PHOTO;ENCODING=b;TYPE=${ext}:${b64}`;
    }
  }

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${safeName}`,
    `N:${lastName};${firstName};;;`,
    safeCompany  ? `ORG:${safeCompany}`        : '',
    safeTitle    ? `TITLE:${safeTitle}`         : '',
    safePhone    ? `TEL;TYPE=CELL:${safePhone}` : '',
    safeEmail    ? `EMAIL:${safeEmail}`          : '',
    safeWebsite  ? `URL:${safeWebsite}`          : '',
    safeLocation ? `ADR;TYPE=HOME:;;${safeLocation};;;;` : '',
    social.linkedin  ? `X-SOCIALPROFILE;type=linkedin:${sanitizeVCardField(social.linkedin)}`   : '',
    social.instagram ? `X-SOCIALPROFILE;type=instagram:${sanitizeVCardField(social.instagram)}` : '',
    social.twitter   ? `X-SOCIALPROFILE;type=twitter:${sanitizeVCardField(social.twitter)}`     : '',
    social.facebook  ? `X-SOCIALPROFILE;type=facebook:${sanitizeVCardField(social.facebook)}`   : '',
    social.youtube   ? `X-SOCIALPROFILE;type=youtube:${sanitizeVCardField(social.youtube)}`     : '',
    social.tiktok    ? `X-SOCIALPROFILE;type=tiktok:${sanitizeVCardField(social.tiktok)}`       : '',
    social.whatsapp  ? `TEL;TYPE=WHATSAPP:${social.whatsapp.replace(/[^\d\+]/g, '')}` : '',
    social.telegram  ? `X-SOCIALPROFILE;type=telegram:${sanitizeVCardField(social.telegram)}`   : '',
    photoLine,
    'END:VCARD'
  ].filter(Boolean);

  return lines.join('\r\n');
}
window.generateVCard = generateVCard;

export function downloadVCard(card) {
  const vcf = generateVCard(card);
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const filename = (card.name || 'contact').replace(/\s+/g, '_') + '.vcf';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Contact saved as ${filename}`, 'success');
}
window.downloadVCard = downloadVCard;

// ── Init on DOMContentLoaded ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initNavScroll();
  initHamburger();
});
