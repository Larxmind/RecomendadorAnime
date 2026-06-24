import polars as pl
import os

def run_data_enrichment():
    print("🚀 Iniciando el Pipeline de acoplamiento de Big Data...")
    
    # Rutas relativas profesionales
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "..", "data")
    
    path_matej = os.path.join(data_dir, "anime_cleaned.csv")
    path_nuevo = os.path.join(data_dir, "anime.csv")
    
    # 1. Escaneo perezoso (Lazy) de los dos catálogos
    print("📂 Escaneando metadatos de las fuentes...")
    df_base = pl.scan_csv(path_matej)
    df_nuevo = pl.scan_csv(path_nuevo, separator="\t")
    
    # 2. Selección y renombrado en el dataset nuevo para evitar colisiones de nombres
    # Nos quedamos con el ID, la portada limpia y los desgloses de votos
    columns_to_extract = [
        "anime_id", 
        "main_pic",
        "synopsis",
        "genres",
        "score_10_count", "score_09_count", "score_08_count", "score_07_count", "score_06_count",
        "score_05_count", "score_04_count", "score_03_count", "score_02_count", "score_01_count"
    ]
    
    df_nuevo_select = df_nuevo.select(columns_to_extract)
    
    # 3. Hacemos el Left Join por 'anime_id'
    print("🔀 Aplicando Left Join para enriquecer el catálogo base...")
    df_final_lazy = df_base.join(df_nuevo_select, on="anime_id", how="left")
    
    # 4. ¡Acción! Aquí es donde Polars optimiza y ejecuta en tu RAM
    print("🧠 Ejecutando el grafo de optimización de Polars con .collect()...")
    catalog_enriquecido = df_final_lazy.collect()
    
    # 5. Control de Calidad de Datos (Data Quality Check) - Nivel Senior
    print("\n📊 --- CONTROL DE CALIDAD DE DATOS ---")
    filas, columnas = catalog_enriquecido.shape
    print(f"🔹 Dimensiones del catálogo final: {filas} animes y {columnas} columnas.")
    
    # Contemos cuántos se quedaron sin portada tras el merge
    nulos_portada = catalog_enriquecido["main_pic"].null_count()
    print(f"⚠️ Animes que no encontraron coincidencia de portada (Nulos): {nulos_portada}")
    
    # 6. Guardar el resultado para la siguiente fase
    output_path = os.path.join(data_dir, "anime_catalog_final.csv")
    catalog_enriquecido.write_csv(output_path)
    print(f"✅ Catálogo maestro guardado con éxito en: {output_path}\n")

if __name__ == "__main__":
    run_data_enrichment()