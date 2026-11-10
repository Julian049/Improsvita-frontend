// El backend no tiene una entidad de plántulas: son datos de cada siembra. GET /sowings trae
// seedlingsAvailable (última visita activa − ventas), estimatedSeedlings y germinatedQuantity.
import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { getAllSowings } from '../sowings/sowingApi';
import { getAllLots } from '../lots/lotApi';
import { getAllSeeds } from '../seeds/seedApi';
import { getBeds } from '../beds/bedApi';

const mockReviews = [];

function fromReviewResponse(review) {
    return {
        reviewId: review.id,
        sowingId: review.sowingId,
        reviewDate: toDateOnly(review.visitDate),
        germinatedQuantity: Number(review.suitableEstimated) || 0,
        notes: '',
    };
}

// Plántulas disponibles para vender: las de la última visita activa, menos lo ya vendido.
export function getSeedlingCount(sowing) {
    return sowing.seedlingsAvailable ?? sowing.germinatedQuantity ?? sowing.estimatedSeedlings ?? null;
}

// Cada siembra con los nombres de su semilla, lote y cama.
export async function getSeedlings() {
    const [sowings, lots, seeds, beds] = await Promise.all([getAllSowings(), getAllLots(), getAllSeeds(), getBeds()]);
    const lotById = new Map(lots.map((l) => [String(l.lotId), l]));
    const seedNameById = new Map(seeds.map((s) => [String(s.seedId), s.name]));
    const bedCodeById = new Map(beds.map((b) => [String(b.bedId), b.code]));

    return sowings.map((sowing) => {
        const lot = lotById.get(String(sowing.lotId));
        return {
            ...sowing,
            seedName: lot ? seedNameById.get(String(lot.seedId)) ?? '' : '',
            lotNumber: lot?.lotNumber ?? '',
            bedCode: bedCodeById.get(String(sowing.bedId)) ?? '',
        };
    });
}

export async function getSowingReviews(sowingId) {
    if (MOCK_CONFIG.sowings) {
        await mockDelay();
        return mockReviews.filter((r) => String(r.sowingId) === String(sowingId));
    }

    const { data } = await axiosClient.get(`/sowings/${sowingId}/visits`);
    return data.map(fromReviewResponse);
}

export async function createSowingReview(sowingId, payload) {
    const request = {
        visitDate: payload.reviewDate || null,
        suitableEstimated: Number(payload.germinatedQuantity),
        visitMethod: 'CONTEO_TOTAL',
        result: 'CONTEO_FINAL',
    };

    if (MOCK_CONFIG.sowings) {
        await mockDelay();
        const review = { reviewId: `rv-${Date.now()}`, sowingId, ...request, notes: request.notes ?? '' };
        mockReviews.push(review);
        return review;
    }

    const { data } = await axiosClient.post(`/sowings/${sowingId}/visits`, request);
    return fromReviewResponse(data);
}
