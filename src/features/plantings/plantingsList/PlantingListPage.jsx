import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getAllPlantings,
    getPlantings,
    updatePlantingGermination,
    updatePlantingStatus,
} from '../plantingApi.js';
import { getAllLots } from '../../lots/lotApi.js';
import { getAllSeeds } from '../../seeds/seedApi.js';
import { getBeds } from '../../beds/bedApi.js';
import { getApiErrorMessage } from '../../../api/apiError.js';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import {
    PLANTING_LIST_MESSAGES,
    PLANTING_STATUS,
    PLANTING_STATUS_OPTIONS,
    getNextStatus,
} from '../plantingStatus.js';
import { groupByStatus } from './plantingListUtils.js';
import { PlantingBedStrip } from './PlantingBedStrip.jsx';
import { PlantingCard } from './PlantingCard.jsx';
import { PlantingDetailModal } from './PlantingDetailModal.jsx';
import './PlantingList.css';

const CLOSE_CONFIRMATIONS = {
    [PLANTING_STATUS.CANCELLED]: {
        title: 'Cancelar siembra',
        message: '¿Seguro que desea cancelar esta siembra? No se podrá volver a cambiar su estado.',
        confirmLabel: 'Cancelar siembra',
    },
    [PLANTING_STATUS.FAILED]: {
        title: 'Marcar siembra como fallida',
        message: '¿Seguro que desea marcar esta siembra como fallida? No se podrá volver a cambiar su estado.',
        confirmLabel: 'Marcar fallida',
    },
};

function replaceIn(list, updated) {
    return list.map((p) => (String(p.plantingId) === String(updated.plantingId) ? updated : p));
}

function PlantingListPage() {
    const [allPlantings, setAllPlantings] = useState([]);
    const [lots, setLots] = useState([]);
    const [seeds, setSeeds] = useState([]);
    const [beds, setBeds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [selectedBedId, setSelectedBedId] = useState('');
    const [bedPlantings, setBedPlantings] = useState([]);
    const [isFetchingBed, setIsFetchingBed] = useState(false);
    const [bedError, setBedError] = useState(null);

    const [selectedPlantingId, setSelectedPlantingId] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [pendingClose, setPendingClose] = useState(null);

    useEffect(() => {
        Promise.all([getAllPlantings(), getAllLots(), getAllSeeds(), getBeds()])
            .then(([plantingsData, lotsData, seedsData, bedsData]) => {
                setAllPlantings(plantingsData);
                setLots(lotsData);
                setSeeds(seedsData);
                setBeds(bedsData);
            })
            .catch(() => setLoadError(PLANTING_LIST_MESSAGES.loadError))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedBedId) return;
        let cancelled = false;

        getPlantings({ mode: 'bedId', value: selectedBedId })
            .then((data) => {
                if (!cancelled) setBedPlantings(data);
            })
            .catch(() => {
                if (!cancelled) setBedError(PLANTING_LIST_MESSAGES.loadError);
            })
            .finally(() => {
                if (!cancelled) setIsFetchingBed(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedBedId]);

    const addNames = useMemo(() => {
        const seedNameById = new Map(seeds.map((s) => [String(s.seedId), s.name]));
        const lotById = new Map(lots.map((lot) => [String(lot.lotId), lot]));
        const bedById = new Map(beds.map((bed) => [String(bed.bedId), bed]));
        return (planting) => {
            const lot = lotById.get(String(planting.lotId));
            return {
                ...planting,
                lotNumber: lot?.lotNumber ?? '',
                seedName: lot ? seedNameById.get(String(lot.seedId)) ?? '' : '',
                bedCode: bedById.get(String(planting.bedId))?.code ?? '',
            };
        };
    }, [lots, seeds, beds]);

    const boardPlantings = useMemo(
        () => (selectedBedId ? bedPlantings : allPlantings).map(addNames),
        [selectedBedId, bedPlantings, allPlantings, addNames]
    );

    const selectedPlanting = selectedPlantingId
        ? boardPlantings.find((p) => String(p.plantingId) === String(selectedPlantingId)) ?? null
        : null;

    function replacePlanting(updated) {
        setAllPlantings((prev) => replaceIn(prev, updated));
        setBedPlantings((prev) => replaceIn(prev, updated));
    }

    function handleSelect(plantingId) {
        setActionError(null);
        setSelectedPlantingId(plantingId);
    }

    function handleBedSelect(bedId) {
        const next = String(selectedBedId) === String(bedId) ? '' : String(bedId);
        setBedError(null);
        setBedPlantings([]);
        setIsFetchingBed(next !== '');
        setSelectedBedId(next);
    }

    async function runUpdate(request, fallbackMessage) {
        setIsUpdating(true);
        setActionError(null);
        try {
            replacePlanting(await request());
            return true;
        } catch (err) {
            setActionError(getApiErrorMessage(err, fallbackMessage));
            return false;
        } finally {
            setIsUpdating(false);
        }
    }

    function handleAdvance(planting) {
        const nextStatus = getNextStatus(planting.status);
        if (!nextStatus) return;
        runUpdate(
            () => updatePlantingStatus(planting.plantingId, nextStatus),
            PLANTING_LIST_MESSAGES.statusError
        );
    }

    function handleSaveGermination(planting, quantity) {
        runUpdate(
            () => updatePlantingGermination(planting.plantingId, quantity),
            PLANTING_LIST_MESSAGES.germinationError
        );
    }

    function handleRequestClose(planting, status) {
        setSelectedPlantingId(null);
        setPendingClose({ planting, status });
    }

    async function handleConfirmClose() {
        const { planting, status } = pendingClose;
        const ok = await runUpdate(
            () => updatePlantingStatus(planting.plantingId, status),
            PLANTING_LIST_MESSAGES.statusError
        );
        setPendingClose(null);
        if (!ok) setSelectedPlantingId(planting.plantingId);
    }

    if (isLoading) {
        return <div className="planting-list-loading">Cargando siembras...</div>;
    }

    if (loadError) {
        return <div className="planting-list-message error">{loadError}</div>;
    }

    if (allPlantings.length === 0) {
        return (
            <div className="planting-list-empty">
                <p>No existen siembras registradas.</p>
                <Link to="/plantings/new" className="seed-button primary">
                    Registrar siembra
                </Link>
            </div>
        );
    }

    const closeConfirmation = pendingClose ? CLOSE_CONFIRMATIONS[pendingClose.status] : null;

    return (
        <div className="planting-list-page">
            <div className="planting-head">
                <div>
                    <h1>Siembras</h1>
                </div>
                <Link to="/plantings/new" className="seed-button primary">
                    + Registrar siembra
                </Link>
            </div>

            <PlantingBedStrip
                beds={beds}
                plantings={allPlantings}
                selectedBedId={selectedBedId}
                onSelect={handleBedSelect}
                onClear={() => handleBedSelect(selectedBedId)}
            />

            {isFetchingBed ? (
                <div className="planting-list-loading">Cargando siembras de la cama...</div>
            ) : bedError ? (
                <div className="planting-list-message error">{bedError}</div>
            ) : (
                <div className="planting-board">
                    {PLANTING_STATUS_OPTIONS.map((step) => {
                        const items = groupByStatus(boardPlantings, step.value);
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
            )}

            <PlantingDetailModal
                planting={selectedPlanting}
                isUpdating={isUpdating}
                errorMessage={actionError}
                onAdvance={handleAdvance}
                onRequestClose={handleRequestClose}
                onSaveGermination={handleSaveGermination}
                onClose={() => setSelectedPlantingId(null)}
            />

            {pendingClose && (
                <ConfirmDialog
                    title={closeConfirmation.title}
                    message={closeConfirmation.message}
                    details={`${pendingClose.planting.seedName} · Lote ${pendingClose.planting.lotNumber} · Cama ${pendingClose.planting.bedCode}`}
                    confirmLabel={closeConfirmation.confirmLabel}
                    cancelLabel="Volver"
                    isConfirming={isUpdating}
                    onConfirm={handleConfirmClose}
                    onCancel={() => setPendingClose(null)}
                />
            )}
        </div>
    );
}

export default PlantingListPage;
