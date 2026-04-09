import { API_BASE_URL } from './lib/api';

export const getBaseURL = () => API_BASE_URL;

export const getPlainEnglishReasons = (techReasons) => {
    if (!techReasons || techReasons.length === 0) {
        return ['Our security system found hidden scam patterns.'];
    }

    const cleanedReasons = techReasons
        .map((reason) => {
            const text = typeof reason === 'string' ? reason : JSON.stringify(reason);
            return text
                .split('\n')[0]
                .replace(/^[^\w(]+/u, '')
                .trim();
        })
        .filter((reason) => !/^AI Confidence Score:\s*\d+(\.\d+)?%?$/i.test(reason));

    return cleanedReasons.length > 0
        ? cleanedReasons
        : ['Our security system found hidden scam patterns.'];
};
