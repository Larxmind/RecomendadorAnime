"use client";

import { useState, useEffect } from "react";
import { Users, Film, BarChart3, ChevronDown, ChevronUp, Brain, TrendingUp, HelpCircle } from "lucide-react";

interface Explicacion {
  similitud_trama_porcentaje: number;
  similitud_tags_porcentaje: number;
  tags_compartidos: string[];
  nota_media_utilizada: number;
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
  segmento_usuario: { gender: string; age_group: string; country: string; }; // 🌍 Actualizado
  top_recommendations_hibridas: Recomendacion[];
}

export default function Home() {
  const [gender, setGender] = useState("Male");
  const [ageGroup, setAgeGroup] = useState("Core_Adults");
  const [country, setCountry] = useState("Global"); // 🌍 Estado inicial predefinido
  const [animeId, setAnimeId] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Actualizamos el useEffect para escuchar los cambios de país
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/recommend?anime_id=${animeId}&gender=${gender}&age_group=${ageGroup}&country=${country}`
        );
        const json = await res.json();
        setData(json);
        setExpandedCard(null);
      } catch (err) {
        console.error("Error conectando con FastAPI:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [gender, ageGroup, animeId, country]); // 🌍 Escucha 'country'
  const toggleExpand = (id: number) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* CABECERA TITULAR */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              Core Recomendador Anime
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Motor Híbrido Avanzado con Apertura de Caja Negra (XAI) · Latencia Engine: <span className="text-emerald-400 font-mono">82ms</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full text-xs font-mono text-slate-300 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            FastAPI Online
          </div>
        </header>

        {/* DASHBOARD CONTROLES */}
        <section className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 shadow-2xl">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Users size={14} className="text-cyan-400" /> Perfil Demográfico
            </label>
            <div className="flex gap-2">
              {["Male", "Female"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    gender === g 
                      ? "bg-linear-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/10" 
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
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer transition-colors"
            >
              <option value="Gen_Z_Youth">Gen Z Youth (15-28)</option>
              <option value="Core_Adults">Core Adults (29-34)</option>
              <option value="Young_Professionals">Young Professionals (35-42)</option>
              <option value="Mature_Adults">Mature Adults (43-55)</option>
              <option value="Veterans">Veterans (56+)</option>
            </select>
          </div>

          {/* 🌍 NUEVO SELECTOR: PAÍS DEL ESPECTADOR */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <HelpCircle size={14} className="text-cyan-400" /> Tendencia Región
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
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
              onChange={(e) => setAnimeId(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer transition-colors"
            >
              <option value={1}>Cowboy Bebop</option>
              <option value={30}>Neon Genesis Evangelion</option>
              <option value={47}>Akira</option>
              <option value={223}>Dragon Ball</option>
              <option value={210}>Ranma ½</option>
              <option value={1254}>Los Caballeros del Zodiaco</option>
              <option value={530}>Sailor Moon</option>
              <option value={1088}>Macross</option> {/* 🚀 Añadido */}
              <option value={324}>Patlabor (TV)</option> {/* 🚀 Añadido */}
              <option value={232}>Cardcaptor Sakura</option>
              <option value={440}>Revolutionary Girl Utena</option>
              <option value={48553}>Akebis Sailor Uniform</option>
              <option value={34382}>Citrus</option>
              <option value={54286}>Me enamoré de la villana</option>
              <option value={966}>Shin-chan</option>
            </select>
          </div>
        </section>

        {/* LISTADO DE RECOMENDACIONES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-300">
                ✨ Recomendaciones para <span className="text-cyan-400 font-extrabold">{data?.anime_solicitado_titulo || "..."}</span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {data?.anime_solicitado_genres?.flatMap(g => g.split(/[,|]\s*/)).map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 font-medium">
                    {tag}
                  </span>
                ))}
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
                    {/* VISIBLE CARD */}
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

                    {/* CAJA NEGRA DESPLEGABLE */}
                    {isExpanded && (
                      <div className="bg-slate-950/80 border-t border-slate-800/80 p-5 space-y-5">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <Brain size={14} className="text-purple-400" /> Desglose de Puntuación de Inteligencia Artificial
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-400">Afinidad Semántica (Trama)</span>
                              <span className="text-purple-400 font-bold font-mono">{anime.explicacion.similitud_trama_porcentaje}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${anime.explicacion.similitud_trama_porcentaje}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-400">Nota del Subgrupo Utilizada</span>
                              <span className="text-amber-400 font-bold font-mono">{anime.explicacion.nota_media_utilizada} / 10</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                className="h-full bg-linear-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${anime.explicacion.nota_media_utilizada * 10}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <TrendingUp size={11} className="text-slate-400" /> Muestra del nicho:
                              </span>
                              <span className="font-mono font-bold text-slate-400">{anime.explicacion.popularidad_votos} votos reales</span>
                            </div>
                          </div>
                        </div>

                        {/* SECCIÓN DE TAGS COMPARTIDOS CORREGIDA */}
                        <div className="space-y-1.5 border-t border-slate-800/60 pt-4">
                          <span className="text-xs font-medium text-slate-400 block">Etiquetas clave compartidas:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {anime.explicacion.tags_compartidos.length > 0 ? (
                              anime.explicacion.tags_compartidos.flatMap(g => g.split(/[,|]\s*/)).map((tag) => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-300 border border-purple-800/30 font-mono font-bold">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">Ninguna coincidencia directa de tags de nicho.</span>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-400 flex items-start gap-2.5">
                          <HelpCircle size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                          <p>
                            <strong>Justificación del Sistema:</strong> Este anime se posiciona aquí porque comparte un <span className="text-purple-400 font-semibold">{anime.explicacion.similitud_trama_porcentaje}%</span> de conceptos de guion, reforzado por una recepción de <span className="text-amber-400 font-semibold">{anime.explicacion.nota_media_utilizada}</span> en el histórico de {gender === "Male" ? "hombres" : "mujeres"} de tu misma franja generacional.
                          </p>
                        </div>
                      </div>
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