import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_BEDS } from '../../mocks/bedMocks';

function fromBedResponse(bed) {
    return {
        bedId: bed.bedId,
        code: bed.code,
        maxCapacity: Number(bed.maxCapacity) || 0,
        active: bed.active,
        createdDate: toDateOnly(bed.createdDate),
        lastUpdated: toDateOnly(bed.lastUpdated),
    };
}

export async function getBeds() {
    if (MOCK_CONFIG.beds) {
        await mockDelay();
        return MOCK_BEDS.map(fromBedResponse);
    }

    const { data } = await axiosClient.get('/beds');
    return data.map(fromBedResponse);
}