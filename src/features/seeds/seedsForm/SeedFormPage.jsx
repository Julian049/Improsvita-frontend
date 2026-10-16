import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGoBack } from '../../../hooks/useGoBack';
import { createSeed, getSeedById, updateSeed } from '../seedApi.js';
import { getSuppliers } from '../../suppliers/supplierApi.js';
import {
    createSeedType,
    deleteSeedType,
    getSeedTypes,
    updateSeedType,
} from '../../seedTypes/seedTypeApi.js';
import { getSeedTypeLabel } from '../../seedTypes/seedTypeUtils.js';
import {
    SEED_TYPE_FORM_INITIAL_VALUES,
    validateSeedTypeForm,
} from '../../seedTypes/seedTypeValidation.js';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import { getApiErrorMessage } from '../../../api/apiError.js';
import {
    FIELD_LABELS,
    SEED_FORM_INITIAL_VALUES,
    validateSeedForm,
} from '../seedValidation.js';
import './SeedForm.css';

function SeedFormPage() {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const goBack = useGoBack('/seeds');

    const [values, setValues] = useState(SEED_FORM_INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [suppliers, setSuppliers] = useState([]);
    const [seedTypes, setSeedTypes] = useState([]);
    const [blockedSupplierIds, setBlockedSupplierIds] = useState([]);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    const [isTypePanelOpen, setIsTypePanelOpen] = useState(false);
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [typeDraft, setTypeDraft] = useState(SEED_TYPE_FORM_INITIAL_VALUES);
    const [typeError, setTypeError] = useState(null);
    const [typeInUseName, setTypeInUseName] = useState(null);
    const [isSavingType, setIsSavingType] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState(null);
    const [isDeletingType, setIsDeletingType] = useState(false);

    const selectedType = seedTypes.find((t) => String(t.seedTypeId) === String(values.typeId)) || null;

    useEffect(() => {
        getSuppliers()
            .then(setSuppliers)
            .catch(() => setSuppliers([]));
    }, []);

    useEffect(() => {
        getSeedTypes()
            .then(setSeedTypes)
            .catch(() => setSeedTypes([]));
    }, []);

    useEffect(() => {
        if (!isEditing) return;

        getSeedById(id)
            .then((seed) => {
                setValues({
                    name: seed.name || '',
                    typeId: seed.typeId ? String(seed.typeId) : '',
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

    function closeTypePanel() {
        setIsTypePanelOpen(false);
        setEditingTypeId(null);
        setTypeDraft(SEED_TYPE_FORM_INITIAL_VALUES);
        setTypeError(null);
        setTypeInUseName(null);
    }

    function handleToggleNewType() {
        if (isTypePanelOpen) {
            closeTypePanel();
            return;
        }
        setEditingTypeId(null);
        setTypeDraft(SEED_TYPE_FORM_INITIAL_VALUES);
        setTypeError(null);
        setTypeInUseName(null);
        setIsTypePanelOpen(true);
    }

    function handleEditType() {
        if (!selectedType) return;
        setEditingTypeId(selectedType.seedTypeId);
        setTypeDraft({ name: selectedType.name, description: selectedType.description });
        setTypeError(null);
        setTypeInUseName(null);
        setIsTypePanelOpen(true);
    }

    function handleTypeDraftChange(field) {
        return (e) => {
            setTypeDraft((prev) => ({ ...prev, [field]: e.target.value }));
            setTypeError(null);
        };
    }

    // Crea o actualiza el tipo; el formulario de la semilla no se toca.
    async function handleSaveType() {
        const typeErrors = validateSeedTypeForm(typeDraft);
        if (Object.keys(typeErrors).length > 0) {
            setTypeError(Object.values(typeErrors)[0]);
            return;
        }

        setIsSavingType(true);
        setTypeError(null);
        try {
            if (editingTypeId) {
                const updated = await updateSeedType(editingTypeId, typeDraft);
                setSeedTypes((prev) => prev.map((t) => (t.seedTypeId === updated.seedTypeId ? updated : t)));
            } else {
                const created = await createSeedType(typeDraft);
                setSeedTypes((prev) => [...prev, created]);
                setValues((prev) => ({ ...prev, typeId: String(created.seedTypeId) }));
                setErrors((prev) => ({ ...prev, typeId: undefined }));
            }
            closeTypePanel();
        } catch (err) {
            setTypeError(getApiErrorMessage(err, 'No se pudo guardar el tipo. Intenta nuevamente.'));
        } finally {
            setIsSavingType(false);
        }
    }

    // Enter dentro del mini-formulario guarda el tipo y no envía el formulario de la semilla.
    function handleTypeKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveType();
        }
    }

    async function handleConfirmDeleteType() {
        const target = typeToDelete;
        setIsDeletingType(true);
        setTypeError(null);
        setTypeInUseName(null);
        try {
            await deleteSeedType(target.seedTypeId);
            setSeedTypes((prev) => prev.filter((t) => t.seedTypeId !== target.seedTypeId));
            setValues((prev) => ({ ...prev, typeId: '' }));
            closeTypePanel();
        } catch (err) {
            if (err.response?.status === 409) {
                setTypeError(
                    `No se puede eliminar el tipo "${getSeedTypeLabel(target.name)}" porque tiene semillas asociadas.`
                );
                setTypeInUseName(target.name);
            } else {
                setTypeError(getApiErrorMessage(err, 'No se pudo eliminar el tipo.'));
            }
        } finally {
            setIsDeletingType(false);
            setTypeToDelete(null);
        }
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
            typeId: values.typeId,
            description: values.description.trim(),
            supplierIds: values.supplierIds,
        };

        setIsSubmitting(true);
        try {
            await (isEditing ? updateSeed(id, payload) : createSeed(payload));
            goBack();
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

                        <div className="seed-field">
                            <span>Tipo *</span>
                            <div className="seed-type-row">
                                <select
                                    aria-label="Tipo"
                                    value={values.typeId}
                                    onChange={handleChange('typeId')}
                                >
                                    <option value="">Selecciona un tipo</option>
                                    {seedTypes.map((seedType) => (
                                        <option key={seedType.seedTypeId} value={String(seedType.seedTypeId)}>
                                            {getSeedTypeLabel(seedType.name)}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="seed-button secondary"
                                    onClick={handleToggleNewType}
                                    aria-expanded={isTypePanelOpen}
                                >
                                    {isTypePanelOpen ? 'Cancelar' : '+ Nuevo tipo'}
                                </button>
                            </div>
                            {errors.typeId && <small className="field-error">{errors.typeId}</small>}

                            {selectedType && (
                                <div className="seed-type-actions">
                                    <button type="button" className="seed-type-link" onClick={handleEditType}>
                                        Editar tipo
                                    </button>
                                    <button
                                        type="button"
                                        className="seed-type-link danger"
                                        onClick={() => setTypeToDelete(selectedType)}
                                    >
                                        Eliminar tipo
                                    </button>
                                </div>
                            )}

                            {isTypePanelOpen && (
                                <div className="seed-type-panel">
                                    <input
                                        type="text"
                                        maxLength={50}
                                        value={typeDraft.name}
                                        onChange={handleTypeDraftChange('name')}
                                        onKeyDown={handleTypeKeyDown}
                                        placeholder="Nombre del tipo *"
                                        aria-label="Nombre del tipo"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        maxLength={255}
                                        value={typeDraft.description}
                                        onChange={handleTypeDraftChange('description')}
                                        onKeyDown={handleTypeKeyDown}
                                        placeholder="Descripción (opcional)"
                                        aria-label="Descripción del tipo"
                                    />
                                    {editingTypeId && (
                                        <small>
                                            Al cambiar el nombre se actualiza en todas las semillas de este tipo.
                                        </small>
                                    )}
                                    <button
                                        type="button"
                                        className="seed-button primary"
                                        onClick={handleSaveType}
                                        disabled={isSavingType}
                                    >
                                        {isSavingType
                                            ? 'Guardando...'
                                            : editingTypeId
                                                ? 'Guardar cambios del tipo'
                                                : 'Guardar tipo'}
                                    </button>
                                </div>
                            )}

                            {typeError && (
                                <small className="field-error" role="alert">
                                    {typeError}
                                </small>
                            )}

                            {typeInUseName && (
                                <button
                                    type="button"
                                    className="seed-type-link"
                                    onClick={() =>
                                        window.open(
                                            `/seeds?type=${encodeURIComponent(typeInUseName)}`,
                                            '_blank',
                                            'noopener'
                                        )
                                    }
                                >
                                    Ver semillas (se abre en otra pestaña)
                                </button>
                            )}
                        </div>
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

            {typeToDelete && (
                <ConfirmDialog
                    title="Eliminar tipo de semilla"
                    message="¿Seguro que desea eliminar este tipo? Solo se puede eliminar si no tiene semillas asociadas."
                    details={getSeedTypeLabel(typeToDelete.name)}
                    confirmLabel="Eliminar"
                    isConfirming={isDeletingType}
                    onConfirm={handleConfirmDeleteType}
                    onCancel={() => setTypeToDelete(null)}
                />
            )}
        </div>
    );
}

export default SeedFormPage;