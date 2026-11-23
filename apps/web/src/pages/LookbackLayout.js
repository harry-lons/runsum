import AppNav from './std/AppNav';

/** Wraps lookback pages with the shared top nav; keeps navy page chrome intact. */
export default function LookbackLayout({ children }) {
  return (
    <div className="lookback-shell">
      <AppNav />
      {children}
    </div>
  );
}
