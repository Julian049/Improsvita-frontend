import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllLots } from '../lotApi.js';
import { getAllSeeds } from '../../seeds/seedApi.js';
import { getLocations } from '../../locations/locationApi.js';
import { LotDetail } from '../lotsList/LotDetail.jsx';
import '../lotsList/LotList.css';

// Trazabilidad por código de lote. El backend no busca por número de lote: se filtra la lista completa.
function LotTracePage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const code = searchParams.get('codigo') ?? '';
    const selectedId = searchParams.get('lote');

    const [draft, setDraft] = useState(code);
    const [lots, setLots] = useState([]);
    const [seeds, setSeeds] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        Promise.all([getAllLots(), getAllSeeds(), getLocations()])
            .then(([lotsData, seedsData, locationsData]) => {
                setLots(lotsData);
                setSeeds(seedsData);
                setLocations(locationsData);
            })
            .catch(() => setLoadError('No se pudo cargar el inventario de lotes.'))
            .finally(() => setIsLoading(false));
    }, []);

    const matches = useMemo(() => {
        if (!code) return [];
        const seedNameById = new Map(seeds.map((s) => [String(s.seedId), s.name]));
        const locationNameById = new Map(locations.map((l) => [String(l.locationId), l.locationName]));
        return lots
            .filter((lot) => String(lot.lotNumber).trim().toLowerCase() === code.trim().toLowerCase())
            .map((lot) => ({
                ...lot,
                seedName: seedNameById.get(String(lot.seedId)) || '',
                locationName: locationNameById.get(String(lot.locationId)) || '',
            }));
    }, [code, lots, seeds, locations]);

    // Un mismo número puede repetirse entre semillas: si hay varios, se elige uno.
    const lot = matches.length === 1 ? matches[0] : matches.find((l) => String(l.lotId) === selectedId);

    function handleSubmit(e) {
        e.preventDefault();
        setSearchParams(draft.trim() ? { codigo: draft.trim() } : {});
    }

    function replaceLot(updated) {
        setLots((prev) => prev.map((l) => (String(l.lotId) === String(updated.lotId) ? updated : l)));
    }

    return (
        <div className="lot-list-page">
            <div className="lot-head">
                <h1>Trazabilidad</h1>
            </div>

            <form className="lot-list-toolbar" onSubmit={handleSubmit}>
                <input
                    className="lot-search-input"
                    aria-label="Código de lote"
                    placeholder="Código de lote, ej. 101"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="seed-button primary">
                    Buscar
                </button>
            </form>

            {isLoading ? (
                <div className="lot-list-loading">Cargando inventario de lotes...</div>
            ) : loadError ? (
                <div className="lot-list-message error">{loadError}</div>
            ) : !code ? (
                <div className="lot-list-message">
                    Escribe el código de un lote para ver su origen, movimientos, siembras y cambiar su estado.
                </div>
            ) : matches.length === 0 ? (
                <div className="lot-list-message">No existe ningún lote con el código “{code}”.</div>
            ) : lot ? (
                <LotDetail
                    key={lot.lotId}
                    lot={lot}
                    backLabel="Nueva búsqueda"
                    onBack={() => {
                        setDraft('');
                        setSearchParams({});
                    }}
                    onSeeSeedLots={(seedId) => navigate('/lots', { state: { seedId: String(seedId) } })}
                    onEdit={(lotId) => navigate(`/lots/${lotId}/edit`)}
                    onLotChange={replaceLot}
                />
            ) : (
                <div className="lot-list-message">
                    Hay {matches.length} lotes con el código “{code}”. Elige uno:
                    <ul className="lot-trace-choices">
                        {matches.map((m) => (
                            <li key={m.lotId}>
                                <button
                                    type="button"
                                    className="lot-link"
                                    onClick={() => setSearchParams({ codigo: code, lote: String(m.lotId) })}
                                >
                                    Lote {m.lotNumber} · {m.seedName || 'Semilla desconocida'} · {m.locationName || '—'}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default LotTracePage;
