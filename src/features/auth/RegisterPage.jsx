import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerRequest } from '../../api/authApi';
import './LoginPage.css';

const MIN_PASSWORD_LENGTH = 8;

function RegisterPage() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function validate() {
        const errors = {};

        if (!name.trim()) {
            errors.name = 'El nombre es obligatorio.';
        }

        if (!email.trim()) {
            errors.email = 'El correo es obligatorio.';
        }

        if (!password) {
            errors.password = 'La contraseña es obligatoria.';
        } else if (password.length < MIN_PASSWORD_LENGTH) {
            errors.password = `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
        }

        if (!confirmPassword) {
            errors.confirmPassword = 'Confirma tu contraseña.';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden.';
        }

        return errors;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitError(null);
        setSuccessMessage(null);

        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsSubmitting(true);
        try {
            await registerRequest({ name: name.trim(), email: email.trim(), password });

            setSuccessMessage('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 1500);
        } catch (err) {
            const message =
                err.response?.data?.message ||
                'No se pudo crear la cuenta. Intenta nuevamente.';
            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="logo">Improsvita</div>
                <p className="login-subtitle">Crea tu cuenta para empezar</p>

                <form onSubmit={handleSubmit} className="login-form" noValidate>
                    <label className="login-field">
                        <span>Nombre</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tu nombre completo"
                            autoFocus
                        />
                        {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
                    </label>

                    <label className="login-field">
                        <span>Correo electrónico</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@correo.com"
                        />
                        {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
                    </label>

                    <label className="login-field">
                        <span>Contraseña</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        {fieldErrors.password && (
                            <small className="field-error">{fieldErrors.password}</small>
                        )}
                    </label>

                    <label className="login-field">
                        <span>Confirmar contraseña</span>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        {fieldErrors.confirmPassword && (
                            <small className="field-error">{fieldErrors.confirmPassword}</small>
                        )}
                    </label>

                    {submitError && <div className="login-error">{submitError}</div>}
                    {successMessage && <div className="login-success">{successMessage}</div>}

                    <button type="submit" className="login-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Creando cuenta...' : 'Registrarme'}
                    </button>
                </form>

                <p className="login-switch">
                    ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;
