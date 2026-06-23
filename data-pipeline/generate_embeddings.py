import polars as pl
import os
import numpy as np
from sentence_transformers import SentenceTransformer

def create_vector_index():
    print("🧠 Iniciando el pipeline de Inteligencia Artificial para Embeddings...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "..", "data")
    
    path_catalogo = os.path.join(data_dir, "anime_catalog_final.csv")
    
    # 1. Cargar el catálogo con Polars y limpiar sinopsis vacías
    df_anime = pl.read_csv(path_catalogo)
    
    # Filtramos para asegurarnos de que solo procesamos lo que tiene texto
    df_clean = df_anime.filter(pl.col("synopsis").is_not_null() & (pl.col("synopsis") != ""))
    
    print(f"📋 Catálogo cargado. Procesando {df_clean.shape[0]} sinopsis válidas...")
    
    # Extraemos las listas en formato nativo de Python para pasárselas al modelo
    synopses = df_clean["synopsis"].to_list()
    anime_ids = df_clean["anime_id"].to_list()
    
    # 2. Inicializar el modelo de Sentence Transformers
    # Este modelo mapea frases y párrafos en un espacio vectorial denso de 384 dimensiones.
    print("🤖 Cargando el modelo de lenguaje (all-MiniLM-L6-v2)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Si tienes la GPU configurada con PyTorch, esto detectará 'cuda' automáticamente y volará
    print(f"💻 Ejecutando computación en dispositivo: {model.device}")
    
    # 3. Generar los Embeddings (Cálculo matemático pesado)
    print("⏳ Generando matriz de embeddings vectoriales (Buscando similitudes semánticas)...")
    embeddings = model.encode(synopses, show_progress_bar=True, batch_size=64)
    
    # 4. Guardar los artefactos para producción
    # Guardamos los vectores en un binario de NumPy (.npy) muy ligero
    vectors_output_path = os.path.join(data_dir, "anime_embeddings.npy")
    np.save(vectors_output_path, embeddings)
    
    # Guardamos un índice mapeado de IDs correspondientes para saber a qué anime pertenece cada fila del vector
    ids_output_path = os.path.join(data_dir, "anime_embeddings_ids.csv")
    pl.DataFrame({"anime_id": anime_ids}).write_csv(ids_output_path)
    
    print(f"\n✅ ¡Fase de IA Completada!")
    print(f"🔹 Matriz de vectores guardada en: {vectors_output_path} con dimensiones {embeddings.shape}")
    print(f"🔹 Índice de correlación guardado en: {ids_output_path}")

if __name__ == "__main__":
    create_vector_index()