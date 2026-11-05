import { useEffect, useMemo, useState } from 'react';
import { getPrediction } from './predictionApi';
import {
    PREDICTION_FIELD_LABELS,
    getPredictionFormInitialValues,
    validatePredictionForm,
} from './predictionValidation';
import { getAllSeeds } from '../seeds/seedApi';
import { getApiErrorMessage } from '../../api/apiError';
import { formatQty } from '../../utils/numberUtils';
import SearchSelect from '../../components/ui/SearchSelect.jsx';
import '../../components/ui/Catalog.css';

function PredictionPage() {
    const [values, setValues] = useState(getPredictionFormInitialValues);
    const [seeds, setSeeds] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoadingSeeds, setIsLoadingSeeds] = useState(true);
    const [seedsError, setSeedsError] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | loading | error | done
    const [result, setResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        getAllSeeds()
            .then(setSeeds)
            .catch(() => setSeedsError('No se pudieron cargar las semillas.'))
            .finally(() => setIsLoadingSeeds(false));
    }, []);

    const seedOptions = useMemo(
        () => seeds.map((seed) => ({ value: seed.seedId, label: seed.name })),
        [seeds]
    );
    const isLoading = status === 'loading';

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
            setSubmitMessage(null);
            // Cambiar un dato invalida lo mostrado antes.
            setStatus('idle');
            setResult(null);
            setErrorMessage(null);
        };
    }

    async function runQuery() {
        setStatus('loading');
        setResult(null);
        setErrorMessage(null);
        try {
            setResult(await getPrediction(values));
            setStatus('done');
        } catch (err) {
            setErrorMessage(getApiErrorMessage(err, 'No se pudo obtener la predicción. Intenta nuevamente.'));
            setStatus('error');
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validatePredictionForm(values);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            const fields = Object.keys(validationErrors)
                .map((field) => PREDICTION_FIELD_LABELS[field] || field)
                .join(', ');
            setSubmitMessage(`Revisa los campos marcados: ${fields}.`);
            return;
        }
        runQuery();
    }

    if (isLoadingSeeds) return <div className="catalog-message">Cargando semillas...</div>;
    if (seedsError) {
        return (
            <div className="catalog-page">
                <div className="catalog-message error">{seedsError}</div>
            </div>
        );
    }

    return (
        <div className="catalog-page">
            <div className="catalog-form-card">
                <h2>Predicción</h2>
                <p className="catalog-form-subtitle">
                    Elige una semilla y un período para solicitar su predicción.
                </p>

                <form onSubmit={handleSubmit} className="catalog-form" noValidate>
                    <fieldset disabled={isLoading} style={{ display: 'contents' }}>
                        <label className="catalog-field">
                            <span>Semilla *</span>
                            <SearchSelect
                                value={values.seedId}
                                onChange={handleChange('seedId')}
                                disabled={isLoading}
                                placeholder="Busca una semilla"
                                aria-label="Semilla"
                                options={seedOptions}
                            />
                            {errors.seedId && <small className="field-error">{errors.seedId}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Desde *</span>
                            <input type="date" value={values.from} onChange={handleChange('from')} />
                            {errors.from && <small className="field-error">{errors.from}</small>}
                        </label>

                        <label className="catalog-field">
                            <span>Hasta *</span>
                            <input type="date" value={values.to} onChange={handleChange('to')} />
                            {errors.to && <small className="field-error">{errors.to}</small>}
                        </label>
                    </fieldset>

                    {submitMessage && <div className="catalog-form-message error">{submitMessage}</div>}

                    <div className="catalog-form-actions">
                        <button type="submit" className="seed-button primary" disabled={isLoading}>
                            {isLoading ? 'Consultando...' : 'Consultar'}
                        </button>
                    </div>
                </form>

                {isLoading && (
                    <div className="catalog-message" role="status">
                        Calculando predicción...
                    </div>
                )}

                {status === 'error' && (
                    <div className="catalog-form-message error" role="alert">
                        {errorMessage}{' '}
                        <button type="button" className="catalog-link" onClick={runQuery}>
                            Reintentar
                        </button>
                    </div>
                )}

                {status === 'done' && result && (
                    <div className="catalog-table-wrapper">
                        <div className="catalog-form-message error" role="note">
                            Datos de ejemplo (simulados), no son una predicción real.
                        </div>
                        <table className="catalog-table">
                            <thead>
                                <tr>
                                    <th>Mes</th>
                                    <th>Unidades estimadas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.months.map((row) => (
                                    <tr key={row.month}>
                                        <td>{row.month}</td>
                                        <td>{formatQty(row.units)}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td><b>Total</b></td>
                                    <td><b>{formatQty(result.total)}</b></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PredictionPage;
