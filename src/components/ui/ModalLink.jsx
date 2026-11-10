import { Link, useLocation } from 'react-router-dom';

function ModalLink({ to, state, ...props }) {
    const location = useLocation();

    return (
        <Link
            to={to}
            state={{ ...state, backgroundLocation: location }}
            {...props}
        />
    );
}

export default ModalLink;
