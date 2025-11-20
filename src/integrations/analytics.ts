declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const getMeasurementId = () => import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export const initAnalytics = () => {
  const measurementId = getMeasurementId();
  if (!measurementId) return;
  if (document.getElementById("ga-gtag")) return;

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag = gtag;

  const script = document.createElement("script");
  script.id = "ga-gtag";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", measurementId);
};
