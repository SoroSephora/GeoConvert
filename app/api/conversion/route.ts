export async function POST(request: Request) {
    const { fromCurrency, toCurrency, amount } = await request.json();
    const parsedAmount = Number(amount);
    const from = typeof fromCurrency === 'string' ? fromCurrency.toUpperCase() : '';
    const to = typeof toCurrency === 'string' ? toCurrency.toUpperCase() : '';
   
    if (!from || !to || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        return new Response(JSON.stringify({ error: 'Données de conversion manquantes ou invalides.' }), { status: 400 });
    }
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Clé API manquante (API_KEY).' }), { status: 500 });
    }
   
    try {
        const externalApiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}/${parsedAmount}`;
        
        const res = await fetch(externalApiUrl, { 
            next: { revalidate: 3600 }
        });
        
        if (!res.ok) {
            throw new Error('Erreur lors de la récupération des taux.');
        }
        const data = await res.json();
        
        // Verif conversion 
        if (data.result !== 'success' || typeof data.conversion_result !== 'number') {
            throw new Error(data['error-type'] || 'Taux non disponible pour ces devises.');
        }
        
        const convertedAmount = Number(data.conversion_result); 
        
        return new Response(JSON.stringify({ result: convertedAmount.toFixed(2) }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
        
    } catch (error) {
        console.error("Erreur API Conversion (exchangerate.host):", error);
        return new Response(JSON.stringify({ error: 'Erreur lors du calcul de la conversion.' }), { status: 500 });
    }
}