# backend/ml_models/predict.py
import warnings
warnings.filterwarnings("ignore")

import sys
import os
import joblib
import pandas as pd

def hacer_prediccion():
    # Obtener la ruta absoluta del directorio actual para no perder de vista los archivos .joblib
    directorio_actual = os.path.dirname(os.path.realpath(__file__))

    # 1. RECIBIR LOS DATOS ENVIADOS POR NODE.JS (sys.argv)
    modelo_elegido = sys.argv[1]       # Espera: 'rf', 'lr' o 'gb'
    tipo_tramite = sys.argv[2]         # Ejemplo: 'Licencia de Funcionamiento'
    canal_ingreso = sys.argv[3]        # Ejemplo: 'Manual' o 'Digital'
    requisitos_totales = int(sys.argv[4])
    requisitos_presentados = int(sys.argv[5])
    dias_en_proceso = int(sys.argv[6])

    # 2. CARGAR DINÁMICAMENTE EL MODELO Y EL ESCALADOR CORRESPONDIENTE
    try:
        if modelo_elegido == 'rf':
            ruta_modelo = os.path.join(directorio_actual, 'modelo_rf.joblib')
            model = joblib.load(ruta_modelo)
            
        elif modelo_elegido == 'lr':
            ruta_modelo = os.path.join(directorio_actual, 'modelo_lr.joblib')
            ruta_scaler = os.path.join(directorio_actual, 'scaler_lr.joblib')
            model = joblib.load(ruta_modelo)
            scaler = joblib.load(ruta_scaler) 
            
        elif modelo_elegido == 'gb':
            ruta_modelo = os.path.join(directorio_actual, 'modelo_gb.joblib')
            model = joblib.load(ruta_modelo)
            
        else:
            print(f"Error: El identificador de modelo '{modelo_elegido}' no es válido.")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error al cargar los archivos binarios (.joblib): {str(e)}")
        sys.exit(1)

    # 3. EXTRAER LA ESTRUCTURA EXACTA DE COLUMNAS DIRECTAMENTE DESDE EL MODELO ENTRENADO
    try:
        if modelo_elegido == 'lr':
            columnas_modelo = list(scaler.feature_names_in_)
        else:
            columnas_modelo = list(model.feature_names_in_)
    except AttributeError:
        # Respaldo con la lista exacta purificada de tu Google Colab
        columnas_modelo = [
            'requisitos_totales', 
            'requisitos_presentados', 
            'dias_en_proceso',
            'tipo_tramite_Licencia de Funcionamiento',
            'tipo_tramite_Permiso de Construcción', 
            'tipo_tramite_Quejas y Reclamos',
            'tipo_tramite_Visación de Planos', 
            'canal_ingreso_Manual'
        ]

    # Inicializamos una fila en ceros (0) usando la estructura oficial que el modelo espera
    df_input = pd.DataFrame(0, index=[0], columns=columnas_modelo)

    # 4. ASIGNAR LAS VARIABLES NUMÉRICAS DIRECTAS
    if 'requisitos_totales' in df_input.columns:
        df_input.loc[0, 'requisitos_totales'] = requisitos_totales
    if 'requisitos_presentados' in df_input.columns:
        df_input.loc[0, 'requisitos_presentados'] = requisitos_presentados
    if 'dias_en_proceso' in df_input.columns:
        df_input.loc[0, 'dias_en_proceso'] = dias_en_proceso

    # 5. REPLICAR EL ONE-HOT ENCODING DE LAS VARIABLES CATEGÓRICAS (Mapeo Flexible)
    for col in df_input.columns:
        # Activamos el tipo de trámite mapeando sin importar minúsculas/mayúsculas o tildes
        if 'tipo_tramite' in col and tipo_tramite.lower() in col.lower():
            df_input.loc[0, col] = 1
            
        # Activamos el canal de ingreso (por ejemplo, si detecta 'manual' en la columna)
        if 'canal_ingreso' in col and canal_ingreso.lower() in col.lower():
            df_input.loc[0, col] = 1

    # 6. EJECUTAR LA PREDICCIÓN EVALUANDO SI REQUIERE ESCALADO PREVIO
    if modelo_elegido == 'lr':
        df_input_scaled = scaler.transform(df_input)
        prediccion = model.predict(df_input_scaled)[0]
    else:
        prediccion = model.predict(df_input)[0]

    # 7. ENVIAR EL RESULTADO A NODE.JS
    print(prediccion)

if __name__ == '__main__':
    # Validamos que Node.js envíe los 6 parámetros requeridos (Nombre del script + 6 argumentos = longitud 7)
    if len(sys.argv) < 7:
        print("Error: Argumentos insuficientes de entrada. Se requieren 6 parámetros.")
        sys.exit(1)
        
    hacer_prediccion()