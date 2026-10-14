import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGoBack } from '../../../hooks/useGoBack';
import { createLot, getLotById, updateLot } from '../lotApi.js';
import { getAllSeeds, getActiveSupplierIdsBySeed } from '../../seeds/seedApi.js';
import { getLocations } from '../../locations/locationApi.js';
import { getSuppliers } from '../../suppliers/supplierApi.js';
import { getApiErrorMessage } from '../../../api/apiError.js';
import {
    LOT_EDIT_REQUIRED_FIELDS,
    LOT_FIELD_LABELS,
    LOT_FORM_INITIAL_VALUES,
    LOT_REQUIRED_FIELDS,
    validateLotForm,
} from '../lotValidation.js';
import SearchSelect from '../../../components/ui/SearchSelect.jsx';
import './LotForm.css';

function LotFormPage() {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const requiredFields = isEditing ? LOT_EDIT_REQUIRED_FIELDS : LOT_REQUIRED_FIELDS;
    const labelFor = (field) =>
        `${LOT_FIELD_LABELS[field]}${requiredFields.includes(field) ? ' *' : ' (opcional)'}`;
    const navigate = useNavigate();
    const goBack = useGoBack('/lots');

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
        Promise.all([getAllSeeds(), getSuppliers(), getLocations(), isEditing ? getLotById(id) : null])
            .then(([seedsData, suppliersData, locationsData, lot]) => {
                setSeeds(seedsData);
                setSuppliers(suppliersData);
                setLocations(locationsData);
                if (lot) {
                    setValues({
                        ...LOT_FORM_INITIAL_VALUES,
                        seedId: String(lot.seedId ?? ''),
                        locationId: String(lot.locationId ?? ''),
                        lotNumber: String(lot.lotNumber ?? ''),
                        germinationPercentage: lot.germinationPercentage == null ? '' : String(lot.germinationPercentage),
                        entryDate: lot.entryDate || '',
                    });
                }
            })
            .catch(() =>
                setLoadError(isEditing ? 'No se pudo cargar el lote solicitado.' : 'No se pudo cargar la información para registrar lotes.')
            )
            .finally(() => setIsLoading(false));
    }, [id, isEditing]);

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

        const validationErrors = validateLotForm(values, requiredFields);
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
            await (isEditing ? updateLot(id, values) : createLot(values));
            goBack();
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(err, 'No se pudo guardar el lote. Intenta nuevamente.'),
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
                <h2>{isEditing ? 'Modificar lote' : 'Registrar lote'}</h2>
                <p className="lot-form-subtitle">
                    {isEditing
                        ? 'Actualiza los datos del lote. La semilla y la cantidad no se modifican aquí.'
                        : 'Registra la entrada de un lote de semillas al inventario.'}
                </p>

                <form onSubmit={handleSubmit} className="lot-form" noValidate>
                    {isEditing ? (
                        <div className="lot-field">
                            <span>{LOT_FIELD_LABELS.seedId}</span>
                            <div className="lot-field-readonly">
                                {seeds.find((seed) => String(seed.seedId) === values.seedId)?.name || '—'}
                            </div>
                        </div>
                    ) : (
                    <div className="lot-form-row">
                            <label className="lot-field">
                                <span>{labelFor('seedId')}</span>
                                <SearchSelect
                                    value={values.seedId}
                                    onChange={handleSeedChange}
                                    placeholder="Busca una semilla"
                                    options={seeds.map((seed) => ({ value: seed.seedId, label: seed.name }))}
                                />
                                {errors.seedId && <small className="field-error">{errors.seedId}</small>}
                            </label>

                            <label className="lot-field">
                                <span>{labelFor('supplierId')}</span>
                                <SearchSelect
                                    value={values.supplierId}
                                    onChange={handleChange('supplierId')}
                                    disabled={!values.seedId || linkedSupplierIds === null}
                                    placeholder={
                                        !values.seedId
                                            ? 'Primero selecciona una semilla'
                                            : linkedSupplierIds === null
                                                ? 'Cargando proveedores...'
                                                : 'Busca un proveedor'
                                    }
                                    options={supplierOptions.map((s) => ({ value: s.supplierId, label: s.name }))}
                                />
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
                    )}

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
                                className="no-spinner"
                                value={values.lotNumber}
                                onChange={handleChange('lotNumber')}
                                placeholder="Ej. 101"
                            />
                            {errors.lotNumber && (
                                <small className="field-error">{errors.lotNumber}</small>
                            )}
                        </label>
                    </div>

                    <div className="lot-form-row">
                        {!isEditing && (
                        <label className="lot-field">
                            <span>{labelFor('quantity')}</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                inputMode="numeric"
                                className="no-spinner"
                                value={values.quantity}
                                onChange={handleChange('quantity')}
                                placeholder="Ej. 100"
                            />
                            {errors.quantity && <small className="field-error">{errors.quantity}</small>}
                        </label>
                        )}

                        <label className="lot-field">
                            <span>{labelFor('germinationPercentage')}</span>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                inputMode="numeric"
                                className="no-spinner"
                                value={values.germinationPercentage}
                                onChange={handleChange('germinationPercentage')}
                                placeholder="Ej. 85"
                            />
                            {errors.germinationPercentage ? (
                                <small className="field-error">{errors.germinationPercentage}</small>
                            ) : (
                                <small>Se usa para estimar la producción de las siembras.</small>
                            )}
                        </label>
                    </div>

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
                                !isEditing && <small>Si la dejas vacía se registra con la fecha de hoy.</small>
                            )}
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
                            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LotFormPage;
