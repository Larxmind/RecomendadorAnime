"use client";

import { useState, useEffect } from "react";
import { Users, Film, BarChart3, ChevronDown, ChevronUp, Brain, TrendingUp, HelpCircle } from "lucide-react";
import Image from "next/image";
interface Explicacion {
  similitud_trama_porcentaje: number;
  similitud_tags_porcentaje: number;
  tags_compartidos: string[];
  nota_media_utilizada: number;
  nota_global_catalogo: number;
  nota_especifica_nicho: number | string;
  origen_de_la_nota: string;
  popularidad_votos: number;
}

interface Recomendacion {
  anime_id: number;
  title: string;
  genres: string[];
  score_final: number;
  explicacion: Explicacion;
}

interface ApiResponse {
  anime_id_solicitado: number;
  anime_solicitado_titulo: string;
  anime_solicitado_genres: string[];
  segmento_usuario: { gender: string; age_group: string; country: string; }; 
  top_recommendations_hibridas: Recomendacion[];
}

// 🎬 COMPONENTE AUXILIAR PARA EXTRAER IMAGEN Y SINOPSIS EN CALIENTE DESDE LA API DE MAL (JIKAN)
function AnimeExtendedDetail({ animeId, explicacion, gender, country }: { animeId: number, explicacion: Explicacion, gender: string, country: string }) {
  const [metadata, setMetadata] = useState<{ image_url: string; synopsis: string } | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    const fetchMALData = async () => {
      try {
        setLoadingMeta(true);
        const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
        if (response.ok) {
          const json = await response.json();
          setMetadata({
            image_url: json.data?.images?.webp?.image_url || json.data?.images?.jpg?.image_url || "",
            synopsis: json.data?.synopsis || "Sinopsis oficial no disponible en este catálogo abierto."
          });
        } else {
          setMetadata({ image_url: "", synopsis: "Servicio de sinopsis temporalmente ocupado por la API externa. Por favor, expande de nuevo en unos segundos." });
        }
      } catch (error) {
        console.error("Error conectando con Jikan API:", error);
        setMetadata({ image_url: "", synopsis: "No se pudo sincronizar la sinopsis con MyAnimeList." });
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMALData();
  }, [animeId]);

  if (loadingMeta) {
    return (
      <div className="p-4 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-center gap-3 text-xs text-slate-500 animate-pulse font-mono">
        <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></span>
        Sincronizando metadatos con MyAnimeList Core API...
      </div>
    );
  }

  return (
    <div className="bg-slate-950/70 border-t border-slate-800/80 p-5 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 animate-fadeIn">
      
      {/* SECCIÓN IZQUIERDA: POSTER Y CONTADORES DE REPUTACIÓN */}
      <div className="flex flex-col items-center md:items-stretch gap-3">
      {metadata?.image_url ? (
        <div className="w-[130px] h-[185px] relative overflow-hidden rounded-lg border border-slate-800 shadow-xl transition-transform hover:scale-102 duration-300 shrink-0">
          <Image 
            src={metadata.image_url} 
            alt="Anime Poster" 
            width={130}
            height={185}
            unoptimized // 💡 Explicación: Al ser URLs de un CDN externo variable, evitamos costes extra de procesado en Vercel
            className="object-cover w-full h-full"
          />
        </div>
      ) : (
        <div className="w-[130px] h-[185px] bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-center p-2 text-[10px] text-slate-600 font-mono shrink-0">
          No Poster
        </div>
      )}
        
        {/* SCORE COMPARATOR COMPONENT */}
        <div className="w-[130px] bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-2 text-center shadow-inner">
          <div>
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">Global MAL</p>
            <p className="text-xs font-mono font-black text-slate-300">⭐ {explicacion.nota_global_catalogo}</p>
          </div>
          <div className="border-t border-slate-800/60 pt-1.5">
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-400">Tu Nicho</p>
            <p className="text-xs font-mono font-black text-cyan-400">
              {explicacion.nota_especifica_nicho === "N/A" ? "📊 N/A" : `📊 ${explicacion.nota_especifica_nicho}`}
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: SINOPSIS, TAGS Y EXPLICACIÓN VECTORIAL */}
      <div className="flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Film size={14} className="text-purple-400" /> Argumento del Guion / Sinopsis Oficial
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed text-justify max-h-[125px] overflow-y-auto pr-1 custom-scrollbar">
            {metadata?.synopsis}
          </p>
        </div>

        {/* Mapeo de tags compartidos dentro del panel expandido */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Etiquetas en común:</span>
          <div className="flex flex-wrap gap-1.5">
            {explicacion.tags_compartidos.length > 0 ? (
              explicacion.tags_compartidos.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-300 border border-purple-800/30 font-mono font-bold">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-500 italic">Ninguna coincidencia directa de tags de nicho.</span>
            )}
          </div>
        </div>

        {/* Caja de Justificación Final */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 flex items-start gap-2.5 shadow-inner">
          <HelpCircle size={15} className="text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong>Justificación del Sistema (XAI):</strong> Este anime se posiciona aquí porque comparte un <span className="text-purple-400 font-semibold">{explicacion.similitud_trama_porcentaje}%</span> de similitud de trama vectorial con el origen, reforzado por una recepción de <span className="text-amber-400 font-semibold">{explicacion.nota_media_utilizada}</span> en el histórico de {gender === "Male" ? "hombres" : "mujeres"} {country === "Global" ? "a nivel global" : `en el subgrupo de ${country === "Spain" ? "España" : country}`}.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [gender, setGender] = useState("Male");
  const [ageGroup, setAgeGroup] = useState("Core_Adults");
  const [country, setCountry] = useState("Global");
  const [animeId, setAnimeId] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  const [alfa, setAlfa] = useState(0.5);
  const [beta, setBeta] = useState(0.3);
  const [gamma, setGamma] = useState(0.2);

  const handleWeightChange = (type: "alfa" | "beta" | "gamma", value: number) => {
    const fixedValue = Math.round(value * 100) / 100;
    const remaining = 1 - fixedValue;

    if (type === "alfa") {
      setAlfa(fixedValue);
      const totalOthers = beta + gamma || 1;
      setBeta(Math.round((beta / totalOthers) * remaining * 100) / 100);
      setGamma(Math.round((gamma / totalOthers) * remaining * 100) / 100);
    } else if (type === "beta") {
      setBeta(fixedValue);
      const totalOthers = alfa + gamma || 1;
      setAlfa(Math.round((alfa / totalOthers) * remaining * 100) / 100);
      setGamma(Math.round((gamma / totalOthers) * remaining * 100) / 100);
    } else {
      setGamma(fixedValue);
      const totalOthers = alfa + beta || 1;
      setAlfa(Math.round((alfa / totalOthers) * remaining * 100) / 100);
      setBeta(Math.round((beta / totalOthers) * remaining * 100) / 100);
    }
  };

// 1. Añade este nuevo estado dentro de tu componente Home
const [latency, setLatency] = useState<number>(0);

// 2. Modifica el useEffect del fetch para medir el tiempo exacto
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    const startTime = performance.now(); // ⏱️ Tiempo de inicio
    try {
      const tagParam = selectedTagFilter ? `&filter_tag=${encodeURIComponent(selectedTagFilter)}` : "";
      const res = await fetch(
        `/recommend?anime_id=${animeId}&gender=${gender}&age_group=${ageGroup}&country=${country}&alfa=${alfa}&beta=${beta}&gamma=${gamma}${tagParam}`
      );
      const json = await res.json();
      setData(json);
      setExpandedCard(null);
      
      const endTime = performance.now(); // ⏱️ Tiempo de fin
      setLatency(Math.round(endTime - startTime)); // Guardamos los ms reales
    } catch (err) {
      console.error("Error conectando con FastAPI:", err);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [gender, ageGroup, animeId, country, alfa, beta, gamma, selectedTagFilter]);

  const toggleExpand = (id: number) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* CABECERA TITULAR */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              Core Recomendador Anime
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Motor Híbrido Avanzado con Apertura de Caja Negra (XAI) · Latencia Engine: <span className="text-emerald-400 font-mono">{latency}ms</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full text-xs font-mono text-slate-300 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            FastAPI Online
          </div>
        </header>

        {/* DASHBOARD CONTROLES TRIPLE FILTRO */}
        <section className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shadow-2xl">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Users size={14} className="text-cyan-400" /> Perfil Demográfico
            </label>
            <div className="flex gap-2">
              {["Male", "Female"].map((g) => (
                <button
                  key={g}
                  onClick={() => { setSelectedTagFilter(null); setGender(g); }}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    gender === g 
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/10" 
                      : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
                  }`}
                >
                  {g === "Male" ? "Hombre" : "Mujer"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Film size={14} className="text-cyan-400" /> Rango de Edad
            </label>
            <select
              value={ageGroup}
              onChange={(e) => { setSelectedTagFilter(null); setAgeGroup(e.target.value); }}
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer transition-colors"
            >
              <option value="Gen_Z_Youth">Gen Z Youth (15-28)</option>
              <option value="Young_Professionals">Young Professionals (23-28)</option>
              <option value="Core_Adults">Core Adults (29-34)</option>
              <option value="Mature_Adults">Mature Adults (35-42)</option>
              <option value="Veterans">Veterans (43+)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <HelpCircle size={14} className="text-cyan-400" /> Tendencia Región
            </label>
            <select
              value={country}
              onChange={(e) => { setSelectedTagFilter(null); setCountry(e.target.value); }}
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer transition-colors"
            >
              <option value="Global">Global (Catálogo Completo)</option>
              <option value="Spain">España</option>
              <option value="United States">Estados Unidos</option>
              <option value="Poland">Polonia</option>
              <option value="Canada">Canadá</option>
              <option value="Brazil">Brasil</option>
              <option value="Germany">Alemania</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <BarChart3 size={14} className="text-cyan-400" /> Anime Origen
            </label>
            <select
              value={animeId}
              onChange={(e) => { setSelectedTagFilter(null); setAnimeId(Number(e.target.value)); }}
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer transition-colors"
            >
              <option value={1}>Cowboy Bebop</option>
              <option value={30}>Neon Genesis Evangelion</option>
              <option value={47}>Akira</option>
              <option value={223}>Dragon Ball</option>
              <option value={210}>Ranma ½</option>
              <option value={1088}>Macross</option>
              <option value={324}>Patlabor (TV)</option>
              <option value={1254}>Los Caballeros del Zodiaco</option>
              <option value={530}>Sailor Moon</option>
              <option value={232}>Cardcaptor Sakura</option>
              <option value={440}>Revolutionary Girl Utena</option>
              <option value={34382}>Citrus</option>
              <option value={966}>Shin-chan</option>
            </select>
          </div>
        </section>

        {/* PANEL DINÁMICO DE CONFIGURACIÓN DE PESOS ALGORÍTMICOS */}
        <section className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Brain size={14} className="text-purple-400" /> Calibración del Pesaje Híbrido (Dynamic Ranking)
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Suma Total: <span className="text-emerald-400 font-bold">{Math.round((alfa + beta + gamma) * 100)}%</span>
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">α · Similitud Argumental</span>
                <span className="text-cyan-400 font-bold font-mono">{Math.round(alfa * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={alfa} onChange={(e) => handleWeightChange("alfa", parseFloat(e.target.value))} className="w-full accent-cyan-500 bg-slate-950 rounded-lg h-1.5 cursor-pointer" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">β · Intersección de Tags</span>
                <span className="text-purple-400 font-bold font-mono">{Math.round(beta * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={beta} onChange={(e) => handleWeightChange("beta", parseFloat(e.target.value))} className="w-full accent-purple-500 bg-slate-950 rounded-lg h-1.5 cursor-pointer" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">γ · Recepción Demográfica</span>
                <span className="text-amber-400 font-bold font-mono">{Math.round(gamma * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={gamma} onChange={(e) => handleWeightChange("gamma", parseFloat(e.target.value))} className="w-full accent-amber-500 bg-slate-950 rounded-lg h-1.5 cursor-pointer" />
            </div>
          </div>
        </section>

        {/* LISTADO DE RECOMENDACIONES HÍBRIDAS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-300">
                ✨ Recomendaciones para <span className="text-cyan-400 font-extrabold">{data?.anime_solicitado_titulo || "..."}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {data?.anime_solicitado_genres?.map((tag) => {
                  const isCurrentFilter = selectedTagFilter === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTagFilter(isCurrentFilter ? null : tag)}
                      className={`text-[11px] px-3 py-1 rounded-full border transition-all cursor-pointer font-semibold ${
                        isCurrentFilter
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20"
                          : "bg-cyan-950/40 text-cyan-400 border-cyan-800/40 hover:bg-cyan-900/40"
                      }`}
                    >
                      {tag} {isCurrentFilter && " ✕"}
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium">Top 10 Predicciones</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-2xl border border-slate-800/60 border-dashed space-y-3">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-cyan-400/80 font-medium animate-pulse font-mono">Ejecutando Álgebra Lineal en RAM...</p>
            </div>
          ) : data && data.top_recommendations_hibridas && data.top_recommendations_hibridas.length > 0 ? (
            <div className="space-y-3">
              {data.top_recommendations_hibridas.map((anime) => {
                const isExpanded = expandedCard === anime.anime_id;
                return (
                  <div 
                    key={anime.anime_id}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-700 shadow-lg"
                  >
                    {/* PARTE VISIBLE DE LA TARJETA */}
                    <div 
                      onClick={() => toggleExpand(anime.anime_id)}
                      className="p-5 flex items-center justify-between cursor-pointer select-none gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs text-slate-500 font-bold uppercase font-mono">ID</span>
                          <span className="text-sm text-slate-300 font-extrabold font-mono">{anime.anime_id}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-100 text-base md:text-lg">
                            {anime.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                              {anime.explicacion.origen_de_la_nota}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Afinidad</span>
                          <span className="text-lg font-extrabold text-cyan-400 font-mono">{anime.score_final}%</span>
                        </div>
                        <div className="text-slate-500">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* CAJA EXTENDIDA CON REDISEÑO INTEGRAL EN DOS COLUMNAS */}
                    {isExpanded && (
                      <AnimeExtendedDetail 
                        animeId={anime.anime_id}
                        explicacion={anime.explicacion}
                        gender={gender}
                        country={country}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/20 border border-slate-800 rounded-xl text-slate-500 text-sm">
              Ninguna recomendación disponible para este criterio.
            </div>
          )}
        </section>

      </div>
    </main>
  );
}