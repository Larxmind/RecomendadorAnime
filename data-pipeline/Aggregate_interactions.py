import polars as pl
import os

def aggregate_massive_data():
    print("🔥 Iniciando el motor de Big Data de Polars para 220M de registros...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "..", "data")
    
    path_usuarios = os.path.join(data_dir, "users_processed_final.csv")
    path_interacciones_comodin = os.path.join(data_dir, "interactions", "user_anime*.csv")
    
    # 1. Escaneo perezoso de usuarios
    df_users = pl.scan_csv(path_usuarios)
    
    # 2. ESCANEO MASIVO CON TIPADO FORZADO
    print("📂 Escaneando interacciones forzando tipos numéricos...")
    # Explicación Senior: Forzamos a Polars a interpretar 'score' y 'anime_id' como enteros.
    # Si encuentra tabuladores vacíos en esas columnas, los convertirá limpiamente en null numérico.
    df_interactions = pl.scan_csv(
        path_interacciones_comodin, 
        separator="\t",
        schema_overrides={
            "anime_id": pl.Int32,
            "score": pl.Int32
        }
    )
    
    # Renombramos la clave de unión de texto para hacer el acoplamiento
    df_interactions = df_interactions.rename({"user_id": "username"})
    
    print("🔀 Cruzando interacciones con perfiles demográficos...")
    df_merged = df_interactions.join(df_users, on="username", how="inner")
    
    print("📊 Filtrando y calculando métricas agregadas por nicho (Anime, Género, Edad)...")
    # Cambios Senior: 
    # 1. Filtramos las notas > 0 para eliminar los registros vacíos o los "plan_to_watch" sin puntuar.
    # 2. Sacamos 'location' temporalmente de la agregación para compactar la tabla final.
    df_stats = (df_merged
        .filter((pl.col("score") > 0) & (pl.col("score").is_not_null()))
        .group_by(["anime_id", "gender", "age_group"])
        .agg([
            pl.col("score").mean().alias("avg_score"),
            pl.len().alias("total_views")
        ])
        .sort(["anime_id", "gender", "age_group"])
    )
    
    print("🧠 Ejecutando optimizaciones de Rust en tu RAM...")
    resultado_estadisticas = df_stats.collect()
    
    # Control de calidad en consola antes de guardar
    print("\n👀 Muestra del resultado final:")
    print(resultado_estadisticas.head(10))
    
    output_path = os.path.join(data_dir, "anime_demographic_stats.csv")
    resultado_estadisticas.write_csv(output_path)
    
    print(f"\n✅ ¡Procesamiento masivo completado con éxito!")
    print(f"🔹 Dimensiones de la tabla final consolidada: {resultado_estadisticas.shape}")

if __name__ == "__main__":
    aggregate_massive_data()