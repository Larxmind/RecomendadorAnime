import polars as pl
import os
from datetime import datetime

def prepare_users():
    print (" Procesando y segmentedo usuarios...")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "..", "data")

    path_users = os.path.join(data_dir, "users_cleaned.csv")

    anio_actual = datetime.now().year

    df_users = pl.scan_csv(path_users)

    # converision columna 'birth_date' a tipo date y calculo de edad
    df_users_with_age = df_users.with_columns([
        pl.col("birth_date").str.to_date(format="%Y-%m-%d %H:%M:%S",strict=False).alias("birth_date_parsed")
    ]).with_columns([
        (anio_actual - pl.col("birth_date_parsed").dt.year()).alias("age")
    ])

    # Clasificacion en rangos de edad
    df_users_segmented = df_users_with_age.with_columns(
        pl.when(pl.col("age") <= 22).then(pl.lit("Gen_Z_Youth"))
        .when((pl.col("age") >= 23) & (pl.col("age") <= 28)).then(pl.lit("Young_Professionals"))
        .when((pl.col("age") >= 29) & (pl.col("age") <= 34)).then(pl.lit("Core_Adults"))
        .when((pl.col("age") >= 35) & (pl.col("age") <= 42)).then(pl.lit("Mature_Adults"))
        .when(pl.col("age") >= 43).then(pl.lit("Veterans"))
        .otherwise(pl.lit("Unknown"))
        .alias("age_group")
    )

    df_users_final = df_users_segmented.select(["user_id", "username", "gender", "age", "age_group", "location"]).collect()

    
    print("\n📊 --- CONTROL DE CALIDAD DE USUARIOS ---")
    print(f"🔹 Total de usuarios procesados: {df_users_final.shape[0]}")
    print("🔹 Distribución por grupos de edad:")
    print(df_users_final["age_group"].value_counts())
    
    # Guardamos este resultado intermedio limpio
    df_users_final.write_csv(os.path.join(data_dir, "users_processed_final.csv"))
    print("✅ Archivo 'users_processed_final.csv' generado con éxito.")

if __name__ == "__main__":
    prepare_users()