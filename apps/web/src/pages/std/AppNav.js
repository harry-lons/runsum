import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../AuthContext';

/**
 * Authenticated top bar: brand + Dashboard | Lookback + logout.
 * Lookback content below keeps its own navy styling; this bar is the shared shell.
 */
export default function AppNav() {
  const auth = useContext(AuthContext);

  return (
    <header className="app-nav">
      <div className="app-nav__inner">
        <NavLink to="/dashboard" className="app-nav__brand">
          RunSum
        </NavLink>

        <nav className="app-nav__tabs" aria-label="Primary">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => {
              const onDash =
                isActive || window.location.pathname.startsWith('/activity/');
              return `app-nav__tab${onDash ? ' is-active' : ''}`;
            }}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/landing"
            className={({ isActive }) => {
              const onLookback =
                isActive ||
                window.location.pathname === '/results' ||
                window.location.pathname === '/landing';
              return `app-nav__tab${onLookback ? ' is-active' : ''}`;
            }}
          >
            Lookback
          </NavLink>
        </nav>

        <div className="app-nav__end">
          {auth?.firstName ? (
            <span className="app-nav__name">{auth.firstName}</span>
          ) : null}
          <button
            type="button"
            className="app-nav__logout"
            onClick={() => auth?.logout?.()}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
