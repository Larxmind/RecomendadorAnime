import polars as pl
import os

def aggregate_massive_data():
    print("🔥 Iniciando el motor de Big Data de Polars para 220M de registros...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "..", "data")
    
    path_usuarios = os.path.join(data_dir, "users_processed_final.csv")
    path_interacciones_comodin = os.path.join(data_dir, "interactions", "user_anime*.csv")
    
    # 1. Escaneo perezoso de usuarios (Ahora arrastra 'country' del pipeline anterior)
    df_users = pl.scan_csv(path_usuarios)
    
    # 2. ESCANEO MASIVO CON TIPADO FORZADO
    print("📂 Escaneando interacciones forzando tipos numéricos...")
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
    
    # Limpieza inicial común compartida por ambos flujos perezosos
    df_cleaned = df_merged.filter((pl.col("score") > 0) & (pl.col("score").is_not_null()))
    
    print("📊 Calculando métricas agregadas por Nicho Geográfico Local...")
    # Bloque A: Agrupación específica por país real del espectador
    df_stats_local = (df_cleaned
        .group_by(["anime_id", "gender", "age_group", "country"])
        .agg([
            pl.col("score").mean().alias("avg_score"),
            pl.len().alias("total_views")
        ])
    )
    
    print("🌍 Calculando métricas agregadas bajo el nodo común 'Global'...")
    # Bloque B: Sobreescribimos la columna country con un literal "Global" y agrupamos
    df_stats_global = (df_cleaned
        .with_columns(pl.lit("Global").alias("country"))
        .group_by(["anime_id", "gender", "age_group", "country"])
        .agg([
            pl.col("score").mean().alias("avg_score"),
            pl.len().alias("total_views")
        ])
    )
    
    print("🔗 Concatenando flujos geográficos en el Grafo de Optimización...")
    # Unimos verticalmente ambas tablas en modo perezoso y ordenamos el conjunto final
    df_stats_final = (pl.concat([df_stats_local, df_stats_global])
        .sort(["anime_id", "gender", "age_group", "country"])
    )
    
    print("🧠 Ejecutando optimizaciones de Rust en tu RAM (Cruces y Agregaciones)...")
    resultado_estadisticas = df_stats_final.collect()
    
    # Control de calidad en consola antes de guardar
    print("\n👀 Muestra del resultado final consolidado (Local + Global):")
    print(resultado_estadisticas.head(15))
    
    # Verificación rápida del peso del nodo por defecto
    print("\n🌍 Muestra específica del volumen de registros del nodo Global:")
    print(resultado_estadisticas.filter(pl.col("country") == "Global").head(5))
    
    output_path = os.path.join(data_dir, "anime_demographic_stats.csv")
    resultado_estadisticas.write_csv(output_path)
    
    print(f"\n✅ ¡Procesamiento masivo completado con éxito!")
    print(f"🔹 Dimensiones de la tabla final consolidada: {resultado_estadisticas.shape}")

if __name__ == "__main__":
    aggregate_massive_data()