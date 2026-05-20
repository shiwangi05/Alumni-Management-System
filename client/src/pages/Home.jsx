import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="home-page">
            <div className="home-container">
                <div className="home-header">
                    <div className="home-icon-wrapper">
                        <span className="home-icon">🎓</span>
                    </div>
                    <h1>AlumniConnect</h1>
                    <p>Connect with Alumni, Find Mentors & Build Your Network</p>
                </div>

                <div className="home-description">
                    <p>Welcome to AlumniConnect - Where alumni and students connect to create meaningful mentorship and professional relationships.</p>
                </div>

                <div className="home-cards">
                    <Link to="/login" className="home-card home-card-signin">
                        <div className="card-icon">🔐</div>
                        <h2>Sign In</h2>
                        <p>Already have an account? Sign in to access your dashboard</p>
                        <button className="btn btn-primary">Sign In Now</button>
                    </Link>

                    <Link to="/register" className="home-card home-card-signup">
                        <div className="card-icon">✨</div>
                        <h2>Create Account</h2>
                        <p>Join our community. Sign up as a student or alumni</p>
                        <button className="btn btn-primary">Sign Up Now</button>
                    </Link>
                </div>

                <div className="home-features">
                    <div className="feature">
                        <span className="feature-icon">👥</span>
                        <h3>Network</h3>
                        <p>Connect with countless alumni from your institution</p>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🎯</span>
                        <h3>Mentorship</h3>
                        <p>Get guidance from experienced professionals</p>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">💬</span>
                        <h3>Chat</h3>
                        <p>Real-time messaging with mentors and peers</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
