'use client';

export function notifyAuthChanged() {
  try {
    localStorage.setItem('tf_auth_event', String(Date.now())); // outras abas
  } catch {}
  try {
    window.dispatchEvent(new Event('tf-auth-changed'));        // mesma aba
  } catch {}
}
