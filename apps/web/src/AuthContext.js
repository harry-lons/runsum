import { createContext, useEffect, useState } from "react";
import { logout as apiLogout, loginWithCode, whoAmI } from './pages/fcts/apiUtils.js';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

const AUTH_SKIP_PATHS = new Set(["/needlogin", "/about", "/FAQ"]);

// Unified component to handle all authentication
export default function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [authReady, setAuthReady] = useState(false);

    // Try logging in 
    // 1. Try to log in from JWT saved to cookie
    // 2. Else try to log in from code in URL bar (on login to landing/dashboard)
    // 3. Else redirect to need login page
    const login = async () => {
        // Try to log in from JWT saved to cookie
        const i_am = await whoAmI().then(data => {
            if (data != null && data['success']) {
                setFirstName(data['first_name'])
                setIsAuthenticated(true)
                return true
            }
            else {
                return false
            }
        });

        if (i_am) {
            return true
        }

        // try getting & using code from url instead
        const searchParams = new URLSearchParams(window.location.search);
        let code = ""
        if (searchParams.has('code')) {
            code = searchParams.get('code');
        }
        else return false

        return loginWithCode(code).then(data => {
            if (data && data['success']) {
                if (data['first_name'] && data['id']) {
                    setFirstName(data['first_name']);
                }
                else throw new Error('Missing first_name or id in login response');

                setIsAuthenticated(true);
                return true;
            } else {
                console.error("logging in with code failed")
                setIsAuthenticated(false);
                setFirstName("");
                return false;
            }
        });
    }

    const navigate = useNavigate()
    useEffect(() => {
        if (AUTH_SKIP_PATHS.has(window.location.pathname)) {
            setAuthReady(true);
            return;
        }

        console.log("AuthContext: useEffect checking login status. Path:", window.location.pathname);

        const doLogin = async () => {
            try {
                const success = await login();
                console.log("AuthContext: doLogin finished. Success:", success);
                const path = window.location.pathname;
                
                if (path === "/") {
                    if (success) {
                        console.log("AuthContext: Redirecting to /dashboard");
                        navigate("/dashboard");
                    }
                    return;
                }

                if (path === "/remembered" && success) {
                    navigate("/dashboard", { replace: true });
                    return;
                }

                // Fresh OAuth on /landing → send to dashboard (lookback is opt-in via nav)
                if (path === "/landing" && success && new URLSearchParams(window.location.search).has('code')) {
                    navigate("/dashboard", { replace: true });
                    return;
                }

                // Fresh OAuth already on /dashboard — strip code from URL
                if (path === "/dashboard" && success && new URLSearchParams(window.location.search).has('code')) {
                    navigate("/dashboard", { replace: true });
                    return;
                }

                if (!success) {
                    window.location.href = "/needlogin";
                }
            }
            catch (Exception) {
                window.location.href = "/needlogin";
            }
            finally {
                setAuthReady(true);
            }
        };

        doLogin()

    }, [navigate]);

    const logout = async () => {
        console.log("AuthContext: logout triggered");
        await apiLogout();
        console.log("AuthContext: apiLogout finished, clearing local state");
        setIsAuthenticated(false);
        setFirstName("");
        navigate("/");
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: isAuthenticated,
                firstName: firstName,
                authReady,
                setIsAuthenticated,
                setFirstName,
                login: login,
                logout: logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
