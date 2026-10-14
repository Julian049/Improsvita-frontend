// SUPUESTO: el backend todavía no tiene plántulas. Endpoints y forma de los datos asumidos
// (ver "Plántulas" en CLAUDE.md); revisar contra la API real cuando exista.
//   GET    /seedlings        -> [{ id, sowingId, quantity, readyDate, status, notes }]
//   GET    /seedlings/{id}
//   PUT    /seedlings/{id}   <- { quantity, readyDate, status, notes }
//   DELETE /seedlings/{id}
import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_SEEDLINGS } from '../../mocks/seedlingMocks';
import { getAllSowings } from '../sowings/sowingApi';
import { getAllLots } from '../lots/lotApi';
import { getAllSeeds } from '../seeds/seedApi';
import { getBeds } from '../beds/bedApi';

function fromSeedlingResponse(seedling) {
    return {
        seedlingId: seedling.id,
        sowingId: seedling.sowingId,
        quantity: Number(seedling.quantity) || 0,
        readyDate: toDateOnly(seedling.readyDate),
        status: seedling.status,
        notes: seedling.notes ?? '',
    };
}

function toSeedlingRequest(payload) {
    return {
        quantity: Number(payload.quantity),
        readyDate: payload.readyDate || null,
        status: payload.status,
        notes: payload.notes?.trim() || null,
    };
}

const findMock = (id) => MOCK_SEEDLINGS.find((s) => String(s.seedlingId) === String(id));

export async function getSeedlings() {
    if (MOCK_CONFIG.seedlings) {
        await mockDelay();
        return [...MOCK_SEEDLINGS];
    }

    const { data } = await axiosClient.get('/seedlings');
    return data.map(fromSeedlingResponse);
}

export async function getSeedlingById(id) {
    if (MOCK_CONFIG.seedlings) {
        await mockDelay();
        const seedling = findMock(id);
        if (!seedling) throw new Error('Plántula no encontrada');
        return seedling;
    }

    const { data } = await axiosClient.get(`/seedlings/${id}`);
    return fromSeedlingResponse(data);
}

export async function updateSeedling(id, payload) {
    if (MOCK_CONFIG.seedlings) {
        await mockDelay();
        return Object.assign(findMock(id), toSeedlingRequest(payload));
    }

    const { data } = await axiosClient.put(`/seedlings/${id}`, toSeedlingRequest(payload));
    return fromSeedlingResponse(data);
}

export async function deleteSeedling(id) {
    if (MOCK_CONFIG.seedlings) {
        await mockDelay();
        MOCK_SEEDLINGS.splice(MOCK_SEEDLINGS.indexOf(findMock(id)), 1);
        return;
    }

    await axiosClient.delete(`/seedlings/${id}`);
}

// Origen de cada plántula: siembra -> lote -> semilla, y la cama. Devuelve un Map por sowingId.
export async function getSowingOrigins() {
    const [sowings, lots, seeds, beds] = await Promise.all([getAllSowings(), getAllLots(), getAllSeeds(), getBeds()]);
    const lotById = new Map(lots.map((l) => [String(l.lotId), l]));
    const seedNameById = new Map(seeds.map((s) => [String(s.seedId), s.name]));
    const bedCodeById = new Map(beds.map((b) => [String(b.bedId), b.code]));

    return new Map(
        sowings.map((s) => {
            const lot = lotById.get(String(s.lotId));
            return [
                String(s.sowingId),
                {
                    seedName: lot ? seedNameById.get(String(lot.seedId)) ?? '' : '',
                    lotNumber: lot?.lotNumber ?? '',
                    bedCode: bedCodeById.get(String(s.bedId)) ?? '',
                    sowingDate: s.sowingDate,
                    quantitySown: s.quantitySown,
                },
            ];
        })
    );
}
