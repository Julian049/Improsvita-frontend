import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

function LoginPage() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitError, setSubmitError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const redirectTo = location.state?.from?.pathname || '/';

    if (isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitError(null);
        setIsSubmitting(true);

        const result = await login({ email, password });

        setIsSubmitting(false);

        if (result.success) {
            navigate(redirectTo, { replace: true });
        } else {
            setSubmitError(result.message);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="logo">Improsvita</div>
                <p className="login-subtitle">Ingresa a tu cuenta para continuar</p>

                <form onSubmit={handleSubmit} className="login-form">
                    <label className="login-field">
                        <span>Correo electrónico</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@correo.com"
                            required
                            autoFocus
                        />
                    </label>

                    <label className="login-field">
                        <span>Contraseña</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </label>

                    {submitError && <div className="login-error">{submitError}</div>}

                    <button type="submit" className="login-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
