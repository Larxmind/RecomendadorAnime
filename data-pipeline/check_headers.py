import polars as pl
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
path_nuevo = os.path.join(base_dir, "..", "data", "anime.csv")

# Leemos solo las 2 primeras filas para inspeccionar la estructura sin saturar
df_test = pl.read_csv(path_nuevo, 
                      n_rows=2,
                      truncate_ragged_lines=True,
                      ignore_errors=True)  # Esto ayuda a manejar filas con columnas faltantes
print("📋 Columnas detectadas en el anime.csv nuevo:")
print(df_test.columns)
print("\n👀 Primeras filas:")
print(df_test.head(2))
