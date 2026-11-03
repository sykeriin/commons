import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();

/** Wire up native chrome: status bar, splash, Android back button. No-op in a browser. */
export async function initNative() {
  if (!isNative()) return;
  const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
    import('@capacitor/status-bar'), import('@capacitor/splash-screen'), import('@capacitor/app'),
  ]);
  const dark = () => document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
  const style = () => StatusBar.setStyle({ style: dark() ? Style.Dark : Style.Light }).catch(() => {});
  style(); matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', style);
  await SplashScreen.hide().catch(() => {});
  // Android hardware back: go back in the router history, exit from the home screen.
  App.addListener('backButton', ({ canGoBack }) => { if (canGoBack && location.hash !== '#/' && location.hash !== '') history.back(); else App.exitApp(); });
}

export async function tap() {
  if (!isNative()) return;
  try { const { Haptics, ImpactStyle } = await import('@capacitor/haptics'); await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* optional */ }
}
