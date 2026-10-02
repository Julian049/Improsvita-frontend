export const MOCK_CONFIG = {
    lots: true,
    seeds: true,
    suppliers: true,
    locations: true,
    plantings: true,
    beds: true,

    delayMs: 300,
};

export const mockDelay = () =>
    new Promise((resolve) => setTimeout(resolve, MOCK_CONFIG.delayMs));