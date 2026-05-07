const rawCountries = [
    { code: 'ES', name: 'España', vat: 21, isEU: true },
    { code: 'DE', name: 'Alemania', vat: 19, isEU: true },
    { code: 'FR', name: 'Francia', vat: 20, isEU: true },
    { code: 'IT', name: 'Italia', vat: 22, isEU: true },
    { code: 'PT', name: 'Portugal', vat: 23, isEU: true },
    { code: 'NL', name: 'Países Bajos', vat: 21, isEU: true },
    { code: 'BE', name: 'Bélgica', vat: 21, isEU: true },
    { code: 'IE', name: 'Irlanda', vat: 23, isEU: true },
    { code: 'AT', name: 'Austria', vat: 20, isEU: true },
    { code: 'PL', name: 'Polonia', vat: 23, isEU: true },
    { code: 'SE', name: 'Suecia', vat: 25, isEU: true },
    { code: 'DK', name: 'Dinamarca', vat: 25, isEU: true },
    { code: 'FI', name: 'Finlandia', vat: 24, isEU: true },

    { code: 'NO', name: 'Noruega', vat: 25, isEU: false },
    { code: 'CH', name: 'Suiza', vat: 0, isEU: false },
    { code: 'GB', name: 'Reino Unido', vat: 20, isEU: false },
    { code: 'US', name: 'Estados Unidos', vat: 0, isEU: false },
    { code: 'CA', name: 'Canadá', vat: 0, isEU: false },
    { code: 'MX', name: 'México', vat: 16, isEU: false },
    { code: 'AR', name: 'Argentina', vat: 21, isEU: false },
    { code: 'CL', name: 'Chile', vat: 19, isEU: false },
    { code: 'CO', name: 'Colombia', vat: 19, isEU: false },
    { code: 'PE', name: 'Perú', vat: 18, isEU: false },
    { code: 'CU', name: 'Cuba', vat: 0, isEU: false },
    { code: 'CN', name: 'China', vat: 13, isEU: false },
    { code: 'JP', name: 'Japón', vat: 10, isEU: false },
    { code: 'KR', name: 'Corea del Sur', vat: 10, isEU: false },
    { code: 'AU', name: 'Australia', vat: 10, isEU: false },
    { code: 'NZ', name: 'Nueva Zelanda', vat: 15, isEU: false }
]

export const EU_COUNTRIES = rawCountries
    .filter(country => country.isEU)
    .map(country => ({
        ...country,
        label: country.name,
        value: country.name,
    }));

export const NON_EU_COUNTRIES = rawCountries
    .filter(country => !country.isEU)
    .map(country => ({
        ...country,
        label: country.name,
        value: country.name,
    }));

export default rawCountries