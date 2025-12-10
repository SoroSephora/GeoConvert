// app/api/geoloc/route.ts
// IMPORTANT: Ce code s'exécute côté serveur.
export async function GET() {
    try {
        // Appel à ipapi.co pour détecter via IP (renvoie directement currency)
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) {
            throw new Error('Erreur lors de la détection IP.');
        }
        const data = await res.json();
        
        const currency = data.currency;
        if (!currency) {
            throw new Error('Devise non détectée.');
        }
        
        return new Response(JSON.stringify({ currency }), { status: 200 });
    } catch (error) {
        console.error("Erreur API Geoloc (GET):", error);
        return new Response(JSON.stringify({ error: 'Erreur lors de la géolocalisation via IP.' }), { status: 500 });
    }
}

export async function POST(request: Request) {
    const { address } = await request.json();
    
    if (!address) {
        return new Response(JSON.stringify({ error: 'Adresse manquante.' }), { status: 400 });
    }
    
    try {
        // 1. Géocodage avec Nominatim (OpenStreetMap) pour obtenir le code pays
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`;
        const geoRes = await fetch(geoUrl, {
            headers: { 'User-Agent': 'GeoConvertApp/1.0' } // Requis par Nominatim pour éviter bans
        });
        if (!geoRes.ok) {
            throw new Error('Erreur lors du géocodage.');
        }
        const geoData = await geoRes.json();
        
        if (geoData.length === 0) {
            throw new Error('Adresse non trouvée.');
        }
        
        const countryCode = geoData[0].address.country_code.toUpperCase();
        
        // 2. Récupérer la devise via restcountries
        const countryUrl = `https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies`;
        const countryRes = await fetch(countryUrl);
        if (!countryRes.ok) {
            throw new Error('Erreur lors de la récupération des infos pays.');
        }
        const countryData = await countryRes.json();
        
        // restcountries renvoie un tableau; on prend le premier élément
        const currencies = Array.isArray(countryData) ? countryData[0]?.currencies : countryData?.currencies;
        const currency = Object.keys(currencies)[0]; // Prendre la première devise principale
        
        if (!currency) {
            throw new Error('Devise non trouvée pour ce pays.');
        }
        
        return new Response(JSON.stringify({ currency }), { status: 200 });
    } catch (error) {
        console.error("Erreur API Geoloc (POST):", error);
        return new Response(JSON.stringify({ error: 'Erreur lors de la géolocalisation via adresse.' }), { status: 500 });
    }
}