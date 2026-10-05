import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getAllSowings,
    getSowings,
    updateSowingGermination,
    updateSowingStatus,
} from '../sowingApi.js';
import { getAllLots } from '../../lots/lotApi.js';
import { getAllSeeds } from '../../seeds/seedApi.js';
import { getBeds } from '../../beds/bedApi.js';
import { getApiErrorMessage } from '../../../api/apiError.js';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import {
    SOWING_LIST_MESSAGES,
    SOWING_STATUS,
    SOWING_STATUS_OPTIONS,
    getNextStatus,
} from '../sowingStatus.js';
import { groupByStatus } from './sowingListUtils.js';
import { SowingBedStrip } from './SowingBedStrip.jsx';
import { SowingCard } from './SowingCard.jsx';
import { SowingDetailModal } from './SowingDetailModal.jsx';
import './SowingList.css';

const CLOSE_CONFIRMATIONS = {
    [SOWING_STATUS.CANCELLED]: {
        title: 'Cancelar siembra',
        message: '¿Seguro que desea cancelar esta siembra? No se podrá volver a cambiar su estado.',
        confirmLabel: 'Cancelar siembra',
    },
    [SOWING_STATUS.FAILED]: {
        title: 'Marcar siembra como fallida',
        message: '¿Seguro que desea marcar esta siembra como fallida? No se podrá volver a cambiar su estado.',
        confirmLabel: 'Marcar fallida',
    },
};

function replaceIn(list, updated) {
    return list.map((sowing) => (String(sowing.sowingId) === String(updated.sowingId) ? updated : sowing));
}

function SowingListPage() {
    const [allSowings, setAllSowings] = useState([]);
    const [lots, setLots] = useState([]);
    const [seeds, setSeeds] = useState([]);
    const [beds, setBeds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [selectedBedId, setSelectedBedId] = useState('');
    const [bedSowings, setBedSowings] = useState([]);
    const [isFetchingBed, setIsFetchingBed] = useState(false);
    const [bedError, setBedError] = useState(null);

    const [selectedSowingId, setSelectedSowingId] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [pendingClose, setPendingClose] = useState(null);

    useEffect(() => {
        Promise.all([getAllSowings(), getAllLots(), getAllSeeds(), getBeds()])
            .then(([sowingsData, lotsData, seedsData, bedsData]) => {
                setAllSowings(sowingsData);
                setLots(lotsData);
                setSeeds(seedsData);
                setBeds(bedsData);
            })
            .catch(() => setLoadError(SOWING_LIST_MESSAGES.loadError))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedBedId) return;
        let cancelled = false;

        getSowings({ mode: 'bedId', value: selectedBedId })
            .then((data) => {
                if (!cancelled) setBedSowings(data);
            })
            .catch(() => {
                if (!cancelled) setBedError(SOWING_LIST_MESSAGES.loadError);
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
        return (sowing) => {
            const lot = lotById.get(String(sowing.lotId));
            return {
                ...sowing,
                lotNumber: lot?.lotNumber ?? '',
                seedName: lot ? seedNameById.get(String(lot.seedId)) ?? '' : '',
                bedCode: bedById.get(String(sowing.bedId))?.code ?? '',
            };
        };
    }, [lots, seeds, beds]);

    const boardSowings = useMemo(
        () => (selectedBedId ? bedSowings : allSowings).map(addNames),
        [selectedBedId, bedSowings, allSowings, addNames]
    );

    const selectedSowing = selectedSowingId
        ? boardSowings.find((sowing) => String(sowing.sowingId) === String(selectedSowingId)) ?? null
        : null;

    function replaceSowing(updated) {
        setAllSowings((prev) => replaceIn(prev, updated));
        setBedSowings((prev) => replaceIn(prev, updated));
    }

    function handleSelect(sowingId) {
        setActionError(null);
        setSelectedSowingId(sowingId);
    }

    function handleBedSelect(bedId) {
        const next = String(selectedBedId) === String(bedId) ? '' : String(bedId);
        setBedError(null);
        setBedSowings([]);
        setIsFetchingBed(next !== '');
        setSelectedBedId(next);
    }

    async function runUpdate(request, fallbackMessage) {
        setIsUpdating(true);
        setActionError(null);
        try {
            replaceSowing(await request());
            return true;
        } catch (err) {
            setActionError(getApiErrorMessage(err, fallbackMessage));
            return false;
        } finally {
            setIsUpdating(false);
        }
    }

    function handleAdvance(sowing) {
        const nextStatus = getNextStatus(sowing.status);
        if (!nextStatus) return;
        runUpdate(
            () => updateSowingStatus(sowing.sowingId, nextStatus),
            SOWING_LIST_MESSAGES.statusError
        );
    }

    function handleSaveGermination(sowing, quantity) {
        runUpdate(
            () => updateSowingGermination(sowing.sowingId, quantity),
            SOWING_LIST_MESSAGES.germinationError
        );
    }

    function handleRequestClose(sowing, status) {
        setSelectedSowingId(null);
        setPendingClose({ sowing, status });
    }

    async function handleConfirmClose() {
        const { sowing, status } = pendingClose;
        const ok = await runUpdate(
            () => updateSowingStatus(sowing.sowingId, status),
            SOWING_LIST_MESSAGES.statusError
        );
        setPendingClose(null);
        if (!ok) setSelectedSowingId(sowing.sowingId);
    }

    if (isLoading) {
        return <div className="sowing-list-loading">Cargando siembras...</div>;
    }

    if (loadError) {
        return <div className="sowing-list-message error">{loadError}</div>;
    }

    if (allSowings.length === 0) {
        return (
            <div className="sowing-list-empty">
                <p>No existen siembras registradas.</p>
                <Link to="/sowings/new" className="seed-button primary">
                    Registrar siembra
                </Link>
            </div>
        );
    }

    const closeConfirmation = pendingClose ? CLOSE_CONFIRMATIONS[pendingClose.status] : null;

    return (
        <div className="sowing-list-page">
            <div className="sowing-head">
                <div>
                    <h1>Siembras</h1>
                </div>
                <Link to="/sowings/new" className="seed-button primary">
                    + Registrar siembra
                </Link>
            </div>

            <SowingBedStrip
                beds={beds}
                sowings={allSowings}
                selectedBedId={selectedBedId}
                onSelect={handleBedSelect}
                onClear={() => handleBedSelect(selectedBedId)}
            />

            {isFetchingBed ? (
                <div className="sowing-list-loading">Cargando siembras de la cama...</div>
            ) : bedError ? (
                <div className="sowing-list-message error">{bedError}</div>
            ) : (
                <div className="sowing-board">
                    {SOWING_STATUS_OPTIONS.map((step) => {
                        const items = groupByStatus(boardSowings, step.value);
                        return (
                            <section
                                key={step.value}
                                className={`sowing-col sowing-status-${step.value.toLowerCase()}`}
                                aria-label={step.label}
                            >
                                <div className="sowing-ch">
                                    <i />
                                    {step.label}
                                    <span>{items.length}</span>
                                </div>

                                {items.length === 0 ? (
                                    <div className="sowing-none">Sin siembras</div>
                                ) : (
                                    items.map((sowing) => (
                                        <SowingCard
                                            key={sowing.sowingId}
                                            sowing={sowing}
                                            onSelect={handleSelect}
                                        />
                                    ))
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            <SowingDetailModal
                sowing={selectedSowing}
                isUpdating={isUpdating}
                errorMessage={actionError}
                onAdvance={handleAdvance}
                onRequestClose={handleRequestClose}
                onSaveGermination={handleSaveGermination}
                onClose={() => setSelectedSowingId(null)}
            />

            {pendingClose && (
                <ConfirmDialog
                    title={closeConfirmation.title}
                    message={closeConfirmation.message}
                    details={`${pendingClose.sowing.seedName} · Lote ${pendingClose.sowing.lotNumber} · Cama ${pendingClose.sowing.bedCode}`}
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

export default SowingListPage;
