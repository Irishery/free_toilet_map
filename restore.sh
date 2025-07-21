#!/bin/bash

# Настройки Docker
DB_CONTAINER_NAME="free_toilet_map-db-1"  # Имя контейнера с базой данных PostgreSQL
DB_NAME="toilet_db"  # Имя базы данных, в которую нужно восстановить
DB_USER="toilet"     # Пользователь базы данных
DB_PASSWORD="toilet" # Пароль пользователя базы данных
BACKUP_FILE="./db_backup_20250721_193044.sql"  # Путь к файлу бэкапа на локальной машине

# Экспортируем пароль базы данных
export PGPASSWORD=$DB_PASSWORD

# Копируем файл бэкапа в контейнер
docker cp $BACKUP_FILE $DB_CONTAINER_NAME:/tmp/db_backup.sql

# Восстановление базы данных с помощью pg_restore
docker exec -i $DB_CONTAINER_NAME pg_restore -U $DB_USER -d $DB_NAME -v /tmp/db_backup.sql

# Проверка успешности восстановления
if [ $? -eq 0 ]; then
  echo "Восстановление базы данных успешно завершено."
else
  echo "Произошла ошибка при восстановлении базы данных."
fi

# Убираем переменную окружения для пароля
unset PGPASSWORD
