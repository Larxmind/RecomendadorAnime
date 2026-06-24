import polars as pl
import os
from datetime import datetime

def prepare_users():
    print("🔄 Procesando y segmentando usuarios con Filtro Geográfico...")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "..", "data")

    path_users = os.path.join(data_dir, "users_cleaned.csv")

    anio_actual = datetime.now().year

    df_users = pl.scan_csv(path_users)

    # Conversión columna 'birth_date' a tipo date y cálculo de edad
    df_users_with_age = df_users.with_columns([
        pl.col("birth_date").str.to_date(format="%Y-%m-%d %H:%M:%S", strict=False).alias("birth_date_parsed")
    ]).with_columns([
        (anio_actual - pl.col("birth_date_parsed").dt.year()).alias("age")
    ])

    # Clasificación en rangos de edad
    df_users_segmented = df_users_with_age.with_columns(
        pl.when(pl.col("age") <= 22).then(pl.lit("Gen_Z_Youth"))
        .when((pl.col("age") >= 23) & (pl.col("age") <= 28)).then(pl.lit("Young_Professionals"))
        .when((pl.col("age") >= 29) & (pl.col("age") <= 34)).then(pl.lit("Core_Adults"))
        .when((pl.col("age") >= 35) & (pl.col("age") <= 42)).then(pl.lit("Mature_Adults"))
        .when(pl.col("age") >= 43).then(pl.lit("Veterans"))
        .otherwise(pl.lit("Unknown"))
        .alias("age_group")
    )

    # 🌍 --- INYECCIÓN SÉNIOR: EXTRACCIÓN Y LIMPIEZA DEL PAÍS ---
    # Tomamos la localización, separamos por comas, cogemos el último bloque y quitamos espacios
    df_users_with_country = df_users_segmented.with_columns([
        pl.col("location")
        .str.split(",")
        .list.get(-1)
        .str.strip_chars()
        .fill_null("Unknown")
        .alias("country")
    ])
# 2. Regex extendida: Incluye estados principales, variantes del país y abreviaturas comunes
    # Añadimos comodines case-insensitive (?i) para asegurar las capturas
    regex_completa_usa = (
        r"(?i)^("
        # Variantes del nombre del país
        r"USA|US|United States|United States of America|U\.S\.A\.|U\.S\.|"
        # Bloque de estados más comunes por volumen en MyAnimeList
        r"California|Texas|New York|Florida|Illinois|Pennsylvania|Ohio|Georgia|North Carolina|Michigan|"
        r"New Jersey|Virginia|Washington|Arizona|Massachusetts|Indiana|Tennessee|Missouri|Maryland|Wisconsin|"
        r"Colorado|Minnesota|South Carolina|Alabama|Louisiana|Kentucky|Oregon|Oklahoma|Connecticut|Utah|"
        # Siglas de dos letras comunes que a veces quedan al final si no se puso ", USA"
        r"CA|TX|NY|FL|IL|PA|OH|GA|NC|MI|VA|WA|AZ|MA|IN|TN|MO|MD|WI|CO|MN"
        r")$"
    )

    df_users_with_country = df_users_with_country.with_columns(
        pl.when(pl.col("country").str.contains(regex_completa_usa))
        .then(pl.lit("United States"))
        .otherwise(pl.col("country"))
        .alias("country")
    )
    # Añadimos 'country' a la proyección final antes de hacer el .collect()
    df_users_final = df_users_with_country.select([
        "user_id", "username", "gender", "age", "age_group", "location", "country"
    ]).collect()

    print("\n📊 --- CONTROL DE CALIDAD DE USUARIOS ---")
    print(f"🔹 Total de usuarios procesados: {df_users_final.shape[0]}")
    print("🔹 Distribución por grupos de edad:")
    print(df_users_final["age_group"].value_counts())
    
    # Control de calidad del nuevo campo geográfico
    print("\n🌍 --- CONTROL GEOGRÁFICO (Top 10 Países) ---")
    print(df_users_final["country"].value_counts().sort("count", descending=True).head(20))
    
    # Guardamos este resultado intermedio limpio
    df_users_final.write_csv(os.path.join(data_dir, "users_processed_final.csv"))
    print("\n✅ Archivo 'users_processed_final.csv' generado con éxito incluyendo localización normalizada.")

if __name__ == "__main__":
    prepare_users()