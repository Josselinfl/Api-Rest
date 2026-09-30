import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# 1. Asegurar que la raíz del proyecto esté en sys.path para importar nuestros módulos
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from config.config_variables import DATABASE_URL
from database.database import Base
# 2. Importar el paquete de modelos para que Base.metadata conozca todas las tablas
import model  # noqa: F401

config = context.config

# 3. Asignar dinámicamente la URL de la base de datos desde nuestras variables de entorno
config.set_main_option("sqlalchemy.url", DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 4. Vincular los metadatos de SQLAlchemy para habilitar la detección automática
target_metadata = Base.metadata