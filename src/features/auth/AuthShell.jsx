function AuthShell({ title, subtitle, children }) {
    return (
        <div className="login-page">
            <main className="login-card">
                <header className="login-card-brand">
                    <img className="login-card-logo" src="/improscol-icon.png" alt="Improscol" />
                    <div>
                        <strong>Improsvita</strong>
                        <span>Gestión de vivero</span>
                    </div>
                </header>

                <h1 className="login-title">{title}</h1>
                <p className="login-subtitle">{subtitle}</p>

                {children}

                <p className="login-footnote">Improscol · Improsvita</p>
            </main>
        </div>
    );
}

export default AuthShell;
