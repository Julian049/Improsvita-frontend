import axiosClient from '../../api/axiosClient';

export async function getAssistantHealth() {
    const response = await axiosClient.get('/assistant/health');
    return response.data;
}

export async function sendAssistantMessage({ message, history }) {
    const response = await axiosClient.post('/assistant/chat', { message, history });
    return response.data;
}
