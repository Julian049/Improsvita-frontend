import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSeed, getSeedById, updateSeed } from '../seedApi.js';
import { getSuppliers } from '../../suppliers/supplierApi.js';
import { getApiErrorMessage } from '../../../api/apiError.js';
import {
    FIELD_LABELS,
    SEED_FORM_INITIAL_VALUES,
    SEED_TYPE_OPTIONS,
    validateSeedForm,
} from '../seedValidation.js';
import './SeedForm.css';

function SeedFormPage() {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [values, setValues] = useState(SEED_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [suppliers, setSuppliers] = useState([]);
    const [blockedSupplierIds, setBlockedSupplierIds] = useState([]);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        getSuppliers()
            .then(setSuppliers)
            .catch(() => setSuppliers([]));
    }, []);

    useEffect(() => {
        if (!isEditing) return;

        getSeedById(id)
            .then((seed) => {
                setValues({
                    name: seed.name || '',
                    type: seed.type || '',
                    description: seed.description || '',
                    supplierIds: seed.supplierIds.map(String),
                });
                setBlockedSupplierIds(seed.blockedSupplierIds.map(String));
            })
            .catch(() => {
                setSubmitMessage({
                    type: 'error',
                    text: 'No se pudo cargar la semilla solicitada.',
                });
            })
            .finally(() => setIsLoading(false));
    }, [id, isEditing]);

    function handleChange(field) {
        return (e) => {
            setValues((prev) => ({ ...prev, [field]: e.target.value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        };
    }

    function handleSupplierToggle(supplierId) {
        const key = String(supplierId);
        setValues((prev) => ({
            ...prev,
            supplierIds: prev.supplierIds.includes(key)
                ? prev.supplierIds.filter((s) => s !== key)
                : [...prev.supplierIds, key],
        }));
        setErrors((prev) => ({ ...prev, supplierIds: undefined }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitMessage(null);

        const validationErrors = validateSeedForm(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            const readableFieldNames = Object.keys(validationErrors)
                .map((field) => FIELD_LABELS[field] || field)
                .join(', ');
            setSubmitMessage({
                type: 'error',
                text: `Revisa los campos marcados: ${readableFieldNames}.`,
            });
            return;
        }

        const payload = {
            name: values.name.trim(),
            type: values.type,
            description: values.description.trim(),
            supplierIds: values.supplierIds,
        };

        setIsSubmitting(true);
        try {
            if (isEditing) {
                const updated = await updateSeed(id, payload);
                setBlockedSupplierIds(updated.blockedSupplierIds.map(String));
                setSubmitMessage({ type: 'success', text: 'Semilla modificada exitosamente.' });
            } else {
                await createSeed(payload);
                setSubmitMessage({ type: 'success', text: 'Semilla registrada exitosamente.' });
                setValues(SEED_FORM_INITIAL_VALUES);
            }
        } catch (err) {
            setSubmitMessage({
                type: 'error',
                text: getApiErrorMessage(err, 'No se pudo guardar la semilla. Intenta nuevamente.'),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="seed-form-loading">Cargando información de la semilla...</div>;
    }

    return (
        <div className="seed-form-page">
            <div className="seed-form-card">
                <h2>{isEditing ? 'Modificar semilla' : 'Registrar semilla'}</h2>
                <p className="seed-form-subtitle">
                    {isEditing
                        ? 'Actualiza la información de esta semilla del catálogo.'
                        : 'Registra una semilla en el catálogo. Las cantidades y fechas se manejan por lote.'}
                </p>

                <form onSubmit={handleSubmit} className="seed-form" noValidate>
                    <div className="seed-form-row">
                        <label className="seed-field">
                            <span>Nombre de la semilla *</span>
                            <input
                                type="text"
                                maxLength={50}
                                value={values.name}
                                onChange={handleChange('name')}
                                placeholder="Ej. Tomate Cherry"
                            />
                            {errors.name && <small className="field-error">{errors.name}</small>}
                        </label>

                        <label className="seed-field">
                            <span>Tipo *</span>
                            <select value={values.type} onChange={handleChange('type')}>
                                <option value="">Selecciona un tipo</option>
                                {SEED_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.type && <small className="field-error">{errors.type}</small>}
                        </label>
                    </div>

                    <label className="seed-field">
                        <span>Descripción (opcional)</span>
                        <textarea
                            maxLength={255}
                            value={values.description}
                            onChange={handleChange('description')}
                            placeholder="Variedad, características, observaciones..."
                        />
                        {errors.description && (
                            <small className="field-error">{errors.description}</small>
                        )}
                    </label>

                    <div className="seed-field">
                        <span>Proveedores (opcional)</span>
                        <div className="seed-checkbox-group">
                            {suppliers.length === 0 && <small>No hay proveedores disponibles.</small>}
                            {suppliers.map((supplier) => {
                                const key = String(supplier.supplierId);
                                const isBlocked = blockedSupplierIds.includes(key);
                                return (
                                    <label key={key} className="seed-checkbox-option">
                                        <input
                                            type="checkbox"
                                            checked={values.supplierIds.includes(key)}
                                            disabled={isBlocked}
                                            onChange={() => handleSupplierToggle(supplier.supplierId)}
                                        />
                                        {supplier.name}
                                        {isBlocked && ' (desvinculado, no se puede volver a vincular)'}
                                    </label>
                                );
                            })}
                        </div>
                        <small>Solo los proveedores vinculados podrán registrar lotes de esta semilla.</small>
                        {errors.supplierIds && (
                            <small className="field-error">{errors.supplierIds}</small>
                        )}
                    </div>

                    {submitMessage && (
                        <div className={`seed-form-message ${submitMessage.type}`}>
                            {submitMessage.text}
                        </div>
                    )}

                    <div className="seed-form-actions">
                        <button
                            type="button"
                            className="seed-button secondary"
                            onClick={() => navigate('/seeds')}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="seed-button primary" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Guardando...'
                                : isEditing
                                    ? 'Guardar cambios'
                                    : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SeedFormPage;
