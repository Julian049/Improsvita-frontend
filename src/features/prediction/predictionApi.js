import axiosClient from '../../api/axiosClient';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { buildMockPrediction } from '../../mocks/predictionMocks';

// SUPUESTO: aún no existe GET /predictions; petición y respuesta son una suposición.
export async function getPrediction({ seedId, from, to }) {
    if (MOCK_CONFIG.prediction) {
        await mockDelay();
        return buildMockPrediction({ seedId, from, to });
    }

    try {
        const { data } = await axiosClient.get('/predictions', { params: { seedId, from, to } });
        return data;
    } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 405) {
            err.userMessage = 'El servidor todavía no ofrece predicciones.';
        }
        throw err;
    }
}
