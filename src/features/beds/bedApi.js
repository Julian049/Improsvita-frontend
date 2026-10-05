import axiosClient from '../../api/axiosClient';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_BEDS } from '../../mocks/bedMocks';

function fromBedResponse(bed) {
    return {
        bedId: bed.id,
        code: bed.code,
        maxCapacity: Number(bed.maxCapacity) || 0,
        active: bed.active,
    };
}

export async function getBeds() {
    if (MOCK_CONFIG.beds) {
        await mockDelay();
        return MOCK_BEDS;
    }

    const { data } = await axiosClient.get('/beds');
    return data.map(fromBedResponse);
}
