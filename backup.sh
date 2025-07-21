#!/bin/bash

# Настройки Docker
DB_CONTAINER_NAME="free_toilet_map-db-1"  # Имя контейнера с базой данных PostgreSQL
DB_NAME="toilet_db"  # Имя базы данных
DB_USER="toilet"     # Пользователь базы данных
DB_PASSWORD="toilet" # Пароль пользователя базы данных
BACKUP_DIR="./"  # Путь к папке, где будет храниться бэкап
DATE=$(date +\%Y\%m\%d_\%H\%M\%S)  # Текущая дата и время для имени файла бэкапа
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"  # Имя файла бэкапа

# Экспортируем пароль базы данных
export PGPASSWORD=$DB_PASSWORD

# Получаем IP контейнера базы данных в Docker
DB_HOST=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $DB_CONTAINER_NAME)

# Выполняем бэкап с помощью pg_dump
docker exec -i $DB_CONTAINER_NAME pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -b -v -f /tmp/db_backup.sql

# Проверка, что файл бэкапа существует в контейнере
if docker exec $DB_CONTAINER_NAME test -f /tmp/db_backup.sql; then
    echo "Бэкап успешно создан внутри контейнера."
else
    echo "Ошибка: файл бэкапа не был создан в контейнере."
    exit 1
fi

# Копируем бэкап из контейнера в локальную файловую систему
docker cp $DB_CONTAINER_NAME:/tmp/db_backup.sql $BACKUP_FILE

# Проверка успешности выполнения
if [ $? -eq 0 ]; then
  echo "Бэкап базы данных успешно завершен: $BACKUP_FILE"
else
  echo "Произошла ошибка при создании бэкапа базы данных."
fi

# Убираем переменную окружения для пароля
unset PGPASSWORD
