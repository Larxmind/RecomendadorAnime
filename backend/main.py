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
    allow_origins=["*"], 
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

# 🧠 OPTIMIZACIÓN: Mapeo de los datos a diccionarios en RAM
anime_titles_dict = dict(zip(df_catalog["anime_id"], df_catalog["title"]))

anime_tags_dict = {
    row["anime_id"]: set(str(row["genres"]).split(", ")) if row["genres"] else set()
    for row in df_catalog.iter_rows(named=True)
}

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
    age_group: str = Query(..., description="Rango de edad procesado del usuario"),
    country: str = Query("Global", description="País/Localización del espectador") # 🌍 Nuevo parámetro con Fallback predefinido
):
    if anime_id not in lista_ids_ia:
        return {"error": f"El anime con ID {anime_id} no tiene un perfil semántico."}
    
    # 1. Cálculo semántico ultrarrápido
    idx_anime_base = lista_ids_ia.index(anime_id)
    vector_base = embeddings[idx_anime_base]
    scores_similitud = np.dot(embeddings, vector_base)
    
    # 2. Filtrado demográfico TRIPLE (Género + Edad + País/Global)
    # Explicación Senior: Polars filtra las 4 dimensiones indexadas en RAM en microsegundos
    df_nicho_usuario = df_stats.filter(
        (pl.col("gender") == gender) & 
        (pl.col("age_group") == age_group) &
        (pl.col("country") == country)
    )
    
    # 💡 CONTROL DE SEGURIDAD (FALLBACK): 
    # Si el nicho está vacío en ese país específico, saltamos automáticamente al nodo "Global"
    if df_nicho_usuario.shape[0] == 0 and country != "Global":
        df_nicho_usuario = df_stats.filter(
            (pl.col("gender") == gender) & 
            (pl.col("age_group") == age_group) &
            (pl.col("country") == "Global")
        )
    
    nicho_dict = {
        row["anime_id"]: (row["avg_score"], int(row["total_views"]))
        for row in df_nicho_usuario.iter_rows(named=True)
    }
    
    # Recuperamos una copia limpia de los tags base
    tags_base = set(anime_tags_dict.get(anime_id, set()))
    tags_base.discard("")
    
    recomendaciones_finales = []
    
    # Iteramos por todo el catálogo usando el índice directo de la matriz de embeddings
    for idx, id_candidato in enumerate(lista_ids_ia):
        if id_candidato == anime_id:
            continue
            
        similitud_trama = float(scores_similitud[idx])
        
        # --- CÁLCULO DE JACCARD ---
        tags_candidato = set(anime_tags_dict.get(id_candidato, set()))
        tags_candidato.discard("")
        
        if tags_base and tags_candidato:
            union = tags_base.union(tags_candidato)
            similitud_tags = len(tags_base.intersection(tags_candidato)) / len(union)
        else:
            similitud_tags = 0.0   

        # --- NOTA DEMOGRÁFICA ---
        if id_candidato in nicho_dict:
            nota_original, total_votos_nicho = nicho_dict[id_candidato]
            tipo_nota = "Específica de tu nicho"
        elif id_candidato in global_means_dict:
            nota_original, total_votos_nicho = global_means_dict[id_candidato]
            tipo_nota = "Media global del catálogo"
        else:
            nota_original = 7.0
            total_votos_nicho = 0
            tipo_nota = "Por defecto (Sin registros)"
        
        nota_demografica = nota_original / 10.0

        # --- REPARTO DE PESOS SÉNIOR ---
        alfa, beta, gamma = 0.5, 0.3, 0.2
        score_hibrido = (alfa * similitud_trama) + (beta * similitud_tags) + (gamma * nota_demografica)

        lista_tags_candidato = list(tags_candidato)
        tags_en_comun = list(tags_base.intersection(tags_candidato))
        titulo = anime_titles_dict.get(id_candidato, "Título Desconocido")
        
        recomendaciones_finales.append({
            "anime_id": id_candidato,
            "title": titulo,
            "score_final": round(score_hibrido * 100, 2),
            "genres": lista_tags_candidato[:5], 
            "explicacion": {
                "similitud_trama_porcentaje": round(similitud_trama * 100, 1),
                "similitud_tags_porcentaje": round(similitud_tags * 100, 1),
                "tags_compartidos": tags_en_comun[:5],
                "nota_media_utilizada": round(nota_original, 2),
                "origen_de_la_nota": tipo_nota,
                "popularidad_votos": total_votos_nicho
            }
        })
        
    # Ordenación descendente basada en el score final combinado
    recomendaciones_finales.sort(key=lambda x: x["score_final"], reverse=True)
    
    return {
        "anime_id_solicitado": anime_id,
        "anime_solicitado_titulo": anime_titles_dict.get(anime_id, "Unknown"),
        "anime_solicitado_genres": list(tags_base), 
        "segmento_usuario": {"gender": gender, "age_group": age_group, "country": country}, # 🌍 Enviamos el país real procesado
        "top_recommendations_hibridas": recomendaciones_finales[:10] 
    }