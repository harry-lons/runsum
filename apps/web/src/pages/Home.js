import Button from '@mui/material/Button';
import StravaButtonIcon from './std/StravaButtonIcon.svg';
import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { mockLogin } from './dashboard/dashboardApi';

function Home(props) {
    const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
    const CALLBACK_DOMAIN = process.env.REACT_APP_CALLBACK_DOMAIN;
    const [demoError, setDemoError] = useState(null);
    const [demoLoading, setDemoLoading] = useState(false);
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    if (!CLIENT_ID || !CALLBACK_DOMAIN) {
        console.log("Missing or misconfigured .env file!");
    }
    // OAuth returns to dashboard as the post-login home
    let to = "https://www.strava.com/oauth/authorize?client_id=" + CLIENT_ID + "&redirect_uri=" + CALLBACK_DOMAIN + "/dashboard&response_type=code&scope=activity:read_all";

    const handleDemo = async () => {
        setDemoError(null);
        setDemoLoading(true);
        try {
            const data = await mockLogin();
            if (auth?.setIsAuthenticated) {
                auth.setIsAuthenticated(true);
                auth.setFirstName(data.first_name || 'Alex');
            }
            navigate('/dashboard');
        } catch (err) {
            setDemoError(err.message || 'Demo unavailable');
        } finally {
            setDemoLoading(false);
        }
    };

    return (
        <div className='home-page'>
            <Button component={Link} to={to}>
                <img src={StravaButtonIcon} alt="Connect with Strava" />
            </Button>
            <button
                type="button"
                className="home-demo"
                onClick={handleDemo}
                disabled={demoLoading}
            >
                {demoLoading ? 'Opening demo…' : 'Preview dashboard (demo data)'}
            </button>
            {demoError ? <p className="home-demo-error">{demoError}</p> : null}
            <a href='/about'>What is this?</a>
        </div>
    );
}

export default Home;
