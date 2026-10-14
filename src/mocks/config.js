export const MOCK_CONFIG = {
    lots: false,
    seeds: false,
    suppliers: false,
    locations: false,
    sowings: false,
    beds: false,
    // SUPUESTO: el backend no tiene plántulas; en true hasta que exista /seedlings.
    seedlings: true,

    delayMs: 300,
};

export const mockDelay = () =>
    new Promise((resolve) => setTimeout(resolve, MOCK_CONFIG.delayMs));