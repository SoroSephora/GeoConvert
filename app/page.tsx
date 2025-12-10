"use client";
import { IoLocationSharp } from "react-icons/io5";
import { BsGlobeAsiaAustralia } from "react-icons/bs";
import { IoIosSearch } from "react-icons/io";
import { CiMoneyCheck1 } from "react-icons/ci";
import { LiaExchangeAltSolid } from "react-icons/lia";
import { useState, useEffect, useCallback } from "react";

interface ConversionResult {
  amount: number;
  from: string;
  to: string;
  result: number;
}

// Définition du composant du Résultat
const ResultDisplay: React.FC<{ data: ConversionResult }> = ({ data }) => {
  if (!data.result) return null;
  return (
    <div className="mt-8 p-6 bg-[#f6f6f6] rounded-xl">
      <h3 className="text-lg font-semibold text- mb-2">Résultat</h3>
      <div className="text-4xl font-semibold text-[#e055ca] ">
        {data.result.toFixed(2)} {data.to}
      </div>
      <p className="text-sm text-[#656565] mt-2">
        {data.amount} {data.from} est équivalent à {data.result.toFixed(2)} {data.to}
      </p>
    </div>
  );
};

export default function Home() {

  // États pour form et result
  const [amount, setAmount] = useState<number | ''>('');
  const [fromCurrency, setFromCurrency] = useState<string>('EUR');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [error, setError] = useState<string | null>(null);
  const [conversionData, setConversionData] = useState<ConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // États pour geoloc
  const [isGeoLocating, setIsGeoLocating] = useState<boolean>(true);
  const [geoLocError, setGeoLocError] = useState<string | null>(null);
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);
  const [address, setAddress] = useState<string>(''); 

  // Liste devises
  const currencies = [
    { code: "EUR", name: "Euro" },
    { code: "USD", name: "Dollar US" },
    { code: "XOF", name: "Franc CFA" },
    { code: "GBP", name: "Livre Sterling" },
    { code: "JPY", name: "Yen" },
    { code: "CHF", name: "Franc Suisse" },
    { code: "AUD", name: "Dollar Australien" },
  ];

  // Logique geoloc 
  useEffect(() => {
    const fetchGeoLocation = async () => {
      setIsGeoLocating(true);
      setGeoLocError(null);
     
      try {
        const response = await fetch('/api/geolocal');
        const data = await response.json();
       
        if (!response.ok || data.error) {
          throw new Error(data.error || "Impossible de déterminer la devise.");
        }
       
        const currency = data.currency;
        setDetectedCurrency(currency);
       
        if (currency) {
          setFromCurrency(currency);
        }
      }  catch {
        // En silence : on passe sur EUR sans afficher d'alerte initiale
        setFromCurrency('EUR');
      }  finally {
        setIsGeoLocating(false);
      }
    };
    fetchGeoLocation();
  }, []);

  
  const handleLocate = useCallback(async () => {
    if (!address) {
      setGeoLocError("Veuillez entrer une adresse.");
      return;
    }
    setIsGeoLocating(true);
    setGeoLocError(null);
    
    try {
      const response = await fetch('/api/geolocal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || "Impossible de déterminer la devise.");
      }
      
      const currency = data.currency;
      setDetectedCurrency(currency);
      
      // Màj devise source
      if (currency) {
        setFromCurrency(currency);
      }
    } catch {
      setGeoLocError("Erreur lors de la localisation. Veuillez réessayer.");
    } finally {
      setIsGeoLocating(false);
    }
  }, [address]);

  // Échange devises
  const handleSwap = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  // Logique de conversion (clic bouton)
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConversionData(null);
   
    if (amount === '' || amount <= 0) {
      setError("Veuillez saisir un montant valide à convertir.");
      return;
    }
   
    if (!fromCurrency || !toCurrency) {
      setError("Veuillez sélectionner les devises source et cible.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          fromCurrency: fromCurrency,
          toCurrency: toCurrency
        })
      });
     
      const data = await response.json();
     
      if (!response.ok || data.error) {
        throw new Error(data.error || "Erreur de conversion inconnue.");
      }
     
      setConversionData({
        amount: Number(amount),
        from: fromCurrency,
        to: toCurrency,
        result: parseFloat(data.result),
      });
    } catch (err) {
      console.error(err);
      setError("Une erreur s'est produite lors de la conversion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [amount, fromCurrency, toCurrency]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white border-b border-[#f6f6f6] top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 text-lg font-bold text-gray-800">
            <LiaExchangeAltSolid className="w-6 h-6 text-[#e055ca]" />
            <span className="text-xl font-extrabold">GeoConvert</span>
          </div>
          <nav>
            <a href="#geoloc" className="text-gray-600 hover:text-[#e055ca] transition duration-150 text-sm font-medium">
              Géolocalisation
            </a>
          </nav>
        </div>
      </header>
     
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-10">
          Bienvenue sur votre site de géolocalisation et de conversion
        </h1>
        
        {/* Section géolocalisation */}
        <section id="geoloc" className="mb-12 p-6 bg-white rounded-xl border border-[#e7e7e7]">
          <div className="flex gap-4 items-center mb-6 pb-4">
            <IoLocationSharp className="w-7 h-7 text-[#bd33a4]" />
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-gray-700">Géolocalisation</h2>
              <p className="text-gray-500 text-sm">Trouvez facilement votre adresse ou un point spécifique.</p>
            </div>
          </div>
          <div className="p-4 bg-[#fef5fd] rounded-xl border border-[#fdeafb]">
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="flex items-center w-full md:w-3/4 bg-white border border-[#e7e7e7] rounded-xl p-3">
                <BsGlobeAsiaAustralia className="text-gray-500 w-5 h-5 mr-3" />
                <input 
                  type="text" 
                  id="adresse" 
                  name="adresse" 
                  placeholder="Entrez une adresse, une ville ou un pays" 
                  className="w-full focus:outline-none text-gray-700 placeholder-gray-400 text-base" 
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <button 
                onClick={handleLocate}
                className="flex items-center justify-center w-full md:w-1/4 bg-[#e055ca] hover:bg-[#bd33a4] transition duration-200 text-white px-4 py-3 cursor-pointer rounded-xl font-medium text-sm"
                disabled={isGeoLocating}
              >
                {isGeoLocating ? 'Localisation...' : <><IoIosSearch className="w-5 h-5 mr-2" /> Localiser</>}
              </button>
            </div>
          </div>
          {geoLocError && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm font-medium">
              {geoLocError}
            </div>
          )}
          {detectedCurrency && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-lg text-sm font-medium">
              Devise détectée : {detectedCurrency}
            </div>
          )}
        </section>
        
        {/* Section devise */}
        <section className="p-6 bg-white rounded-xl border border-[#e7e7e7]">
          <div className="flex gap-4 items-center mb-6 pb-4">
            <CiMoneyCheck1 className="w-7 h-7 text-[#bd33a4]" />
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-gray-700">Conversion de Devise</h2>
              <p className="text-gray-500 text-sm">Convertissez entre devises</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Montant à convertir</h3>
              <div className="rounded-xl border border-[#e7e7e7] bg-[#f6f6f6] p-4">
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    id="montant"
                    name="montant"
                    placeholder="0.00"
                    className="focus:outline-none w-3/4 bg-transparent text-2xl font-bold text-gray-800"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  />
                  <p className="text-lg font-semibold text-gray-500">{fromCurrency}</p>
                </div>
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg mb-4 text-sm font-medium">
                {error}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              {/* Devise Source */}
              <div className="flex flex-col w-full sm:w-1/2">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Devise source</h3>
                <div className="relative">
                  <select
                    name="source"
                    id="source"
                    className="w-full border border-[#e7e7e7] rounded-xl p-4 appearance-none focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer"
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}>
                    <option value="" disabled>Veuillez sélectionner une devise</option>
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center pt-8 sm:pt-6">
                <LiaExchangeAltSolid className="w-6 h-6 text-gray-500 hover:text-[#e055ca] transition duration-150 cursor-pointer" title="Échanger les devises" onClick={handleSwap} />
              </div>
              <div className="flex flex-col w-full sm:w-1/2">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Devise cible</h3>
                <div className="relative">
                  <select
                    name="cible"
                    id="cible"
                    className="w-full border border-gray-300 rounded-xl p-4 appearance-none focus:ring-[#f5b2ec] focus:border-[#f5b2ec] bg-white cursor-pointer"
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}>
                    <option value="" disabled>Veuillez sélectionner une devise</option>
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
           
            <div className="mt-8">
              <button type="submit" className="w-full flex items-center justify-center gap-3 bg-linear-to-r from-[#ee84dd] to-[#b671db] transition duration-200 ease-in-out transform hover:scale-[1.01] text-white px-6 py-3 rounded-xl font-semibold text-lg cursor-pointer "
                disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Conversion en cours...
                  </div>
                ) : (
                  <>
                    <LiaExchangeAltSolid className="w-5 h-5" /> Convertir maintenant
                  </>
                )}
              </button>
            </div>
          </form>
          {conversionData && <ResultDisplay data={conversionData} />}
        </section>
      </main>
    
      <footer className="bg-gray-600 text-white mt-12 py-6">
        <div className="flex justify-center items-center w-60 border mx-auto mt-4 rounded-full border-[#6d6d6d] p-2 text-gray-300">
          <div className="relative flex h-3 w-3 mr-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ee84dd] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e055ca]"></span>
          </div>
          <p className="font-medium text-gray-100">By Seph</p>
        </div>
        <div className="max-w-4xl mx-auto px-4 pt-6 sm:px-6 lg:px-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} GeoConvert</p>
        </div>
      </footer>
    </div>
  );
}