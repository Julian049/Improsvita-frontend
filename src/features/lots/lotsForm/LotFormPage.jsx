import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createLot } from '../lotApi.js';
import { getAllSeeds, getActiveSupplierIdsBySeed } from '../../seeds/seedApi.js';
import { getLocations } from '../../locations/locationApi.js';
import { getSuppliers } from '../../suppliers/supplierApi.js';
import { getApiErrorMessage } from '../../../api/apiError.js';
import {
    LOT_FIELD_LABELS,
    LOT_FORM_INITIAL_VALUES,
    LOT_REQUIRED_FIELDS,
    validateLotForm,
} from '../lotValidation.js';
import './LotForm.css';

const isRequired = (field) => LOT_REQUIRED_FIELDS.includes(field);
const labelFor = (field) => `${LOT_FIELD_LABELS[field]}${isRequired(field) ? ' *' : ' (opcional)'}`;

function LotFormPage() {
    const navigate = useNavigate();

    const [values, setValues] = useState(LOT_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [seeds, setSeeds] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // null = aún no se han cargado los proveedores de la semilla elegida.
    const [linkedSupplierIds, setLinkedSupplierIds] = useState([]);
    const [linksError, setLinksError] = useState(null);
    const currentSeedRef = useRef('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        Promise.all([getAllSeeds(), getSuppliers(), getLocations()])
            .then(([seedsData, suppliersData, locationsData]) => {
                setSeeds(seedsData);
                setSuppliers(suppliersData);
                setLocations(locationsData);
            })
            .catch(() => setLoadError('No se pudo cargar la información para registrar lotes.'))
            .finally(() => setIsLoading(false));
    }, []);

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    function handleSeedChange(e) {
        const seedId = e.target.value;
        currentSeedRef.current = seedId;
        setValues((prev) => ({ ...prev, seedId, supplierId: '' }));
        setErrors((prev) => ({ ...prev, seedId: undefined, supplierId: undefined }));
        setLinksError(null);

        if (!seedId) {
            setLinkedSupplierIds([]);
            return;
        }

        setLinkedSupplierIds(null);
        getActiveSupplierIdsBySeed(seedId)
            .then((ids) => {
                if (currentSeedRef.current === seedId) setLinkedSupplierIds(ids.map(String));
            })
            .catch(() => {
                if (currentSeedRef.current !== seedId) return;
                setLinkedSupplierIds([]);
                setLinksError('No se pudieron cargar los proveedores de esta semilla.');
            });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateLotForm(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            const readableFieldNames = Object.keys(validationErrors)
                .map((field) => LOT_FIELD_LABELS[field] || field)
                .join(', ');
            setSubmitMessage({
                type: 'error',
                text: `Revisa los campos marcados: ${readableFieldNames}.`,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const lot = await createLot(values);
            setSubmitMessage({
                type: 'success',
                text: `Lote ${lot.lotNumber} registrado exitosamente.`,
            });
            currentSeedRef.current = '';
            setValues(LOT_FORM_INITIAL_VALUES);
            setLinkedSupplierIds([]);
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(err, 'No se pudo registrar el lote. Intenta nuevamente.'),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="lot-form-loading">Cargando información del lote...</div>;
    }

    if (loadError) {
        return (
            <div className="lot-form-page">
                <div className="lot-form-message error">{loadError}</div>
            </div>
        );
    }

    const supplierOptions = linkedSupplierIds
        ? suppliers.filter((s) => linkedSupplierIds.includes(String(s.supplierId)))
        : [];
    const seedHasNoSuppliers = values.seedId && linkedSupplierIds?.length === 0 && !linksError;

    return (
        <div className="lot-form-page">
            <div className="lot-form-card">
                <h2>Registrar lote</h2>
                <p className="lot-form-subtitle">
                    Registra la entrada de un lote de semillas al inventario.
                </p>

                <form onSubmit={handleSubmit} className="lot-form" noValidate>
                    <div className="lot-form-row">
                        <label className="lot-field">
                            <span>{labelFor('seedId')}</span>
                            <select value={values.seedId} onChange={handleSeedChange}>
                                <option value="">Selecciona una semilla</option>
                                {seeds.map((seed) => (
                                    <option key={seed.seedId} value={seed.seedId}>
                                        {seed.name}
                                    </option>
                                ))}
                            </select>
                            {errors.seedId && <small className="field-error">{errors.seedId}</small>}
                        </label>

                        <label className="lot-field">
                            <span>{labelFor('supplierId')}</span>
                            <select
                                value={values.supplierId}
                                onChange={handleChange('supplierId')}
                                disabled={!values.seedId || linkedSupplierIds === null}
                            >
                                <option value="">
                                    {!values.seedId
                                        ? 'Primero selecciona una semilla'
                                        : linkedSupplierIds === null
                                            ? 'Cargando proveedores...'
                                            : 'Selecciona un proveedor'}
                                </option>
                                {supplierOptions.map((supplier) => (
                                    <option key={supplier.supplierId} value={supplier.supplierId}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            {errors.supplierId && (
                                <small className="field-error">{errors.supplierId}</small>
                            )}
                            {linksError && <small className="field-error">{linksError}</small>}
                            {seedHasNoSuppliers && (
                                <small className="field-error">
                                    Esta semilla no tiene proveedores vinculados.{' '}
                                    <Link to={`/seeds/${values.seedId}/edit`}>Vincular proveedores</Link>
                                </small>
                            )}
                        </label>
                    </div>

                    <div className="lot-form-row">
                        <label className="lot-field">
                            <span>{labelFor('locationId')}</span>
                            <select value={values.locationId} onChange={handleChange('locationId')}>
                                <option value="">Selecciona una ubicación</option>
                                {locations.map((location) => (
                                    <option key={location.locationId} value={location.locationId}>
                                        {location.locationName}
                                    </option>
                                ))}
                            </select>
                            {errors.locationId && (
                                <small className="field-error">{errors.locationId}</small>
                            )}
                        </label>

                        <label className="lot-field">
                            <span>{labelFor('lotNumber')}</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={values.lotNumber}
                                onChange={handleChange('lotNumber')}
                                placeholder="Ej. 101"
                            />
                            {errors.lotNumber && (
                                <small className="field-error">{errors.lotNumber}</small>
                            )}
                        </label>
                    </div>

                    <label className="lot-field">
                        <span>{labelFor('quantity')}</span>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            value={values.quantity}
                            onChange={handleChange('quantity')}
                            placeholder="Ej. 100"
                        />
                        {errors.quantity && <small className="field-error">{errors.quantity}</small>}
                    </label>

                    <div className="lot-form-row">
                        <label className="lot-field">
                            <span>{labelFor('entryDate')}</span>
                            <input
                                type="date"
                                value={values.entryDate}
                                onChange={handleChange('entryDate')}
                            />
                            {errors.entryDate ? (
                                <small className="field-error">{errors.entryDate}</small>
                            ) : (
                                <small>Si la dejas vacía se registra con la fecha de hoy.</small>
                            )}
                        </label>

                        <label className="lot-field">
                            <span>{labelFor('dueDate')}</span>
                            <input
                                type="date"
                                value={values.dueDate}
                                onChange={handleChange('dueDate')}
                            />
                            {errors.dueDate && <small className="field-error">{errors.dueDate}</small>}
                        </label>
                    </div>

                    {submitMessage && (
                        <div className={`lot-form-message ${submitMessage.type}`}>
                            {submitMessage.text}
                        </div>
                    )}

                    <div className="lot-form-actions">
                        <button
                            type="button"
                            className="seed-button secondary"
                            onClick={() => navigate('/lots')}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="seed-button primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LotFormPage;
