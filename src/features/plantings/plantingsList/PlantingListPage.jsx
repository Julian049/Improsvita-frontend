import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllPlantings, updatePlantingActive, updatePlantingStatus } from '../plantingApi.js';
import { getAllLots } from '../../lots/lotApi.js';
import { getBeds } from '../../beds/bedApi.js';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import {
    PLANTING_LIST_MESSAGES,
    PLANTING_STATUS_FLOW,
    getNextStatus,
} from '../plantingStatus.js';
import {
    PLANTING_FILTERS_INITIAL_STATE,
    filterByStatus,
    filterPlantings,
    searchPlantings,
} from './plantingListUtils.js';
import { PlantingBedStrip } from './PlantingBedStrip.jsx';
import { PlantingCard } from './PlantingCard.jsx';
import { PlantingDetailModal } from './PlantingDetailModal.jsx';
import './PlantingList.css';

function PlantingListPage() {
    const [plantings, setPlantings] = useState([]);
    const [lots, setLots] = useState([]);
    const [beds, setBeds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [searchText, setSearchText] = useState('');
    const [filters, setFilters] = useState(PLANTING_FILTERS_INITIAL_STATE);
    const [selectedPlantingId, setSelectedPlantingId] = useState(null);

    const [isUpdating, setIsUpdating] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [plantingToDeactivate, setPlantingToDeactivate] = useState(null);

    useEffect(() => {
        Promise.all([getAllPlantings(), getAllLots(), getBeds()])
            .then(([plantingsData, lotsData, bedsData]) => {
                setPlantings(plantingsData);
                setLots(lotsData);
                setBeds(bedsData);
            })
            .catch(() => setLoadError(PLANTING_LIST_MESSAGES.loadError))
            .finally(() => setIsLoading(false));
    }, []);

    const plantingsWithNames = useMemo(() => {
        const lotById = new Map(lots.map((lot) => [String(lot.lotId), lot]));
        const bedById = new Map(beds.map((bed) => [String(bed.bedId), bed]));
        return plantings.map((planting) => {
            const lot = lotById.get(String(planting.lotId));
            const bed = bedById.get(String(planting.bedId));
            return {
                ...planting,
                lotNumber: lot?.lotNumber ?? '',
                seedName: lot?.seedName ?? '',
                bedCode: bed?.code ?? '',
            };
        });
    }, [plantings, lots, beds]);

    const visiblePlantings = useMemo(
        () => filterPlantings(searchPlantings(plantingsWithNames, searchText), filters),
        [plantingsWithNames, searchText, filters]
    );

    const selectedPlanting = selectedPlantingId
        ? plantingsWithNames.find((p) => String(p.plantingId) === String(selectedPlantingId)) ?? null
        : null;

    function replacePlanting(updated) {
        setPlantings((prev) =>
            prev.map((p) => (String(p.plantingId) === String(updated.plantingId) ? updated : p))
        );
    }

    function handleSelect(plantingId) {
        setActionError(null);
        setSelectedPlantingId(plantingId);
    }

    function handleBedSelect(bedId) {
        setFilters((prev) => ({
            ...prev,
            bedId: String(prev.bedId) === String(bedId) ? '' : String(bedId),
        }));
    }

    async function handleAdvance(planting) {
        const nextStatus = getNextStatus(planting.status);
        if (!nextStatus) return;

        setIsUpdating(true);
        setActionError(null);
        try {
            const updated = await updatePlantingStatus(planting.plantingId, nextStatus);
            replacePlanting(updated);
        } catch (err) {
            setActionError(err.response?.data?.message || PLANTING_LIST_MESSAGES.statusError);
        } finally {
            setIsUpdating(false);
        }
    }

    async function changeActive(planting, active) {
        setIsUpdating(true);
        setActionError(null);
        try {
            const updated = await updatePlantingActive(planting.plantingId, active);
            replacePlanting(updated);
            return true;
        } catch (err) {
            setActionError(err.response?.data?.message || PLANTING_LIST_MESSAGES.activeError);
            return false;
        } finally {
            setIsUpdating(false);
        }
    }

    function handleToggleActive(planting) {
        if (planting.active) {
            // El ConfirmDialog no se ve encima de un <dialog> modal: se cierra el detalle primero.
            setSelectedPlantingId(null);
            setPlantingToDeactivate(planting);
            return;
        }
        changeActive(planting, true);
    }

    async function handleConfirmDeactivate() {
        const planting = plantingToDeactivate;
        const ok = await changeActive(planting, false);
        setPlantingToDeactivate(null);
        if (!ok) setSelectedPlantingId(planting.plantingId);
    }

    if (isLoading) {
        return <div className="planting-list-loading">Cargando siembras...</div>;
    }

    if (loadError) {
        return <div className="planting-list-message error">{loadError}</div>;
    }

    if (plantings.length === 0) {
        return (
            <div className="planting-list-empty">
                <p>No existen siembras registradas.</p>
                <Link to="/plantings/new" className="seed-button primary">
                    Registrar siembra
                </Link>
            </div>
        );
    }

    return (
        <div className="planting-list-page">
            <div className="planting-head">
                <div>
                    <h1>Siembras</h1>
                    <p>Sigue cada siembra desde que se planta hasta que germina.</p>
                </div>
                <Link to="/plantings/new" className="seed-button primary">
                    + Registrar siembra
                </Link>
            </div>

            <PlantingBedStrip
                beds={beds}
                plantings={plantings}
                selectedBedId={filters.bedId}
                onSelect={handleBedSelect}
                onClear={() => setFilters(PLANTING_FILTERS_INITIAL_STATE)}
            />

            <input
                type="search"
                className="planting-search"
                placeholder="Buscar por semilla, lote, cama o notas"
                aria-label="Buscar siembras"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
            />

            <div className="planting-board">
                {PLANTING_STATUS_FLOW.map((step) => {
                    const items = filterByStatus(visiblePlantings, step.value);
                    return (
                        <section
                            key={step.value}
                            className={`planting-col planting-status-${step.value.toLowerCase()}`}
                            aria-label={step.label}
                        >
                            <div className="planting-ch">
                                <i />
                                {step.label}
                                <span>{items.length}</span>
                            </div>

                            {items.length === 0 ? (
                                <div className="planting-none">Sin siembras</div>
                            ) : (
                                items.map((planting) => (
                                    <PlantingCard
                                        key={planting.plantingId}
                                        planting={planting}
                                        onSelect={handleSelect}
                                    />
                                ))
                            )}
                        </section>
                    );
                })}
            </div>

            <PlantingDetailModal
                planting={selectedPlanting}
                isUpdating={isUpdating}
                errorMessage={actionError}
                onAdvance={handleAdvance}
                onToggleActive={handleToggleActive}
                onClose={() => setSelectedPlantingId(null)}
            />

            {plantingToDeactivate && (
                <ConfirmDialog
                    title="Desactivar siembra"
                    message="¿Seguro que desea desactivar esta siembra? Dejará de ocupar espacio en la cama."
                    details={`${plantingToDeactivate.seedName} · Lote ${plantingToDeactivate.lotNumber} · Cama ${plantingToDeactivate.bedCode}`}
                    confirmLabel="Desactivar"
                    isConfirming={isUpdating}
                    onConfirm={handleConfirmDeactivate}
                    onCancel={() => setPlantingToDeactivate(null)}
                />
            )}
        </div>
    );
}

export default PlantingListPage;
