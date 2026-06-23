from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import polars as pl
import numpy as np
import os

app = FastAPI(
    title="Core Recomendador Anime - API Inteligente",
    description="Backend de alto rendimiento con FastAPI, Polars y Embeddings Vectoriales",
    version="1.0.0"
)

# Permitir que tu Front-end en Next.js se conecte sin problemas de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiarías esto por la URL de tu Vercel/Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CARGA DE ARTEFACTOS EN MEMORIA (Al arrancar el servidor) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")

print("🔌 Cargando bases de datos optimizadas...")
df_catalog = pl.read_csv(os.path.join(DATA_DIR, "anime_catalog_final.csv"))
df_stats = pl.read_csv(os.path.join(DATA_DIR, "anime_demographic_stats.csv"))
embeddings = np.load(os.path.join(DATA_DIR, "anime_embeddings.npy"))
df_embeddings_ids = pl.read_csv(os.path.join(DATA_DIR, "anime_embeddings_ids.csv"))

# 🧠 OPTIMIZACIÓN CRUCIAL SENIOR: Mapeamos los datos a diccionarios en RAM
# Mapeo de ID -> Título
anime_titles_dict = dict(zip(df_catalog["anime_id"], df_catalog["title"]))

# Pre-calculamos la media global por anime para no buscarla en el bucle
print("📊 Pre-calculando medias globales del catálogo...")
df_global_means = df_stats.group_by("anime_id").agg([
    pl.col("avg_score").mean().alias("global_avg"),
    pl.col("total_views").sum().alias("global_views")
])
global_means_dict = {
    row["anime_id"]: (row["global_avg"], int(row["global_views"])) 
    for row in df_global_means.iter_rows(named=True)
}

lista_ids_ia = df_embeddings_ids["anime_id"].to_list()
print("✅ Estructuras de datos indexadas y listas para alta velocidad.")

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "Motor Híbrido Corriendo en FastAPI"}

@app.get("/api/v1/recommend")
def get_recommendations(
    anime_id: int, 
    gender: str = Query(..., description="Género del usuario logueado"),
    age_group: str = Query(..., description="Rango de edad procesado del usuario")
):
    if anime_id not in lista_ids_ia:
        return {"error": f"El anime con ID {anime_id} no tiene un perfil semántico."}
    
    # 1. Cálculo semántico ultrarrápido
    idx_anime_base = lista_ids_ia.index(anime_id)
    vector_base = embeddings[idx_anime_base]
    scores_similitud = np.dot(embeddings, vector_base)
    
    # 2. Filtrado demográfico inicial indexado en un diccionario rápido para la petición
    df_nicho_usuario = df_stats.filter((pl.col("gender") == gender) & (pl.col("age_group") == age_group))
    nicho_dict = {
        row["anime_id"]: (row["avg_score"], int(row["total_views"]))
        for row in df_nicho_usuario.iter_rows(named=True)
    }
    
    recomendaciones_finales = []
    
    # 3. El bucle ahora solo hace consultas O(1) a memoria pura
    for idx, id_candidato in enumerate(lista_ids_ia):
        if id_candidato == anime_id:
            continue
            
        similitud_trama = float(scores_similitud[idx])
        
        # Opción A: Buscar en el nicho pre-filtrado
        if id_candidato in nicho_dict:
            nota_original, total_votos_nicho = nicho_dict[id_candidato]
            tipo_nota = "Específica de tu nicho"
        # Opción B: Buscar en las medias globales pre-calculadas en el arranque
        elif id_candidato in global_means_dict:
            nota_original, total_votos_nicho = global_means_dict[id_candidato]
            tipo_nota = "Media global del catálogo"
        # Opción C: Por defecto
        else:
            nota_original = 7.0
            total_votos_nicho = 0
            tipo_nota = "Por defecto (Sin registros)"
        
        nota_demografica = nota_original / 10.0
        
        # Ponderación
        alfa, beta = 0.7, 0.3
        score_hibrido = (alfa * similitud_trama) + (beta * nota_demografica)
        
        # Recuperar título del diccionario instantáneo
        titulo = anime_titles_dict.get(id_candidato, "Título Desconocido")
        
        recomendaciones_finales.append({
            "anime_id": id_candidato,
            "title": titulo,
            "score_final": round(score_hibrido * 100, 2),
            "explicacion": {
                "similitud_trama_porcentaje": round(similitud_trama * 100, 1),
                "nota_media_utilizada": round(nota_original, 2),
                "origen_de_la_nota": tipo_nota,
                "popularidad_votos": total_votos_nicho
            }
        })
        
    recomendaciones_finales.sort(key=lambda x: x["score_final"], reverse=True)
    return {
        "anime_id_solicitado": anime_id,
        "anime_solicitado_titulo": anime_titles_dict.get(anime_id, "Unknown"),
        "segmento_usuario": {"gender": gender, "age_group": age_group},
        "top_recomendaciones_hibridas": recomendaciones_finales[:5]
    }