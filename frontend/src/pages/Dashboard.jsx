import { useEffect, useState } from "react";
import { Container, Title, Loader, Alert } from "@mantine/core";
import { modals } from "@mantine/modals";
import api from "../api";
import { useAuth } from "../hooks/useAuth";
import { parseJwt } from "../utils";
import MapContainer from "../components/ToiletMap";  // Импортируем MapComponent
import { ModalAddToilet } from "../components/ModalAddToilet";  // Импортируем ModalAddToilet
import { ModalContent } from "../components/ModalContent";  // Импортируем ModalContent
import { useGeolocation } from "../hooks/useGeolocation";

export default function Dashboard() {
  const { token, logout } = useAuth();
  const { position, error } = useGeolocation(); // Получаем текущие координаты
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setError] = useState(""); // Сообщения об ошибке
  const [activeToilet, setActiveToilet] = useState(null);
  const [userId, setUserId] = useState(null); // Хранение user_id

  // Проверка токена и его валидности
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";  // Перенаправление на страницу логина, если токен отсутствует
      return;
    }

    const decodedToken = parseJwt(token);  // Парсим токен
    if (!decodedToken || decodedToken.exp * 1000 < Date.now()) {
      logout();  // Выход из системы, если токен истёк
      window.location.href = "/login";  // Перенаправление на страницу логина
      return;
    }

    setUserId(decodedToken.user_id);  // Сохраняем user_id
  }, [token, logout]);

  // Загружаем список туалетов
  useEffect(() => {
    api.get("/toilets")
      .then((res) => setToilets(res.data))
      .catch(() => setError("Не удалось загрузить туалеты"))
      .finally(() => setLoading(false));
  }, []);

  // Открыть модальное окно для добавления нового туалета
  const handleAddToilet = (lat, lng) => {
    modals.open({
      title: "Добавить новый туалет",
      size: "lg",
      centered: true,
      children: (
        <ModalAddToilet
          lat={lat}
          lng={lng}
          onSubmit={(name, toiletType) => submitNewToilet(name, lat, lng, toiletType)}
          onClose={() => modals.closeAll()}
        />
      ),
    });
  };

  // Добавление нового туалета
  const submitNewToilet = async (name, lat, lng, toiletType) => {
    try {
      const response = await api.post("/toilet/add", {
        name,
        point: `${lat},${lng}`,
        type: toiletType,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const toilet = {
        ...response.data,
        point: response.data.point ?? `${lat},${lng}`,
        founder_id: response.data.founder_id ?? userId,
        id: response.data.id ?? Date.now(),
      };

      setToilets((prev) => [...prev, toilet]);
      modals.closeAll();
    } catch (error) {
      setError("Ошибка при добавлении туалета: " + error.message);
    }
  };

  // Удаление туалета
  const deleteToilet = async (id) => {
    try {
      await api.delete("/toilet/delete", {
        data: { id },
        headers: { Authorization: `Bearer ${token}` },
      });

      setToilets((prev) => prev.filter((t) => t.id !== id));
      modals.closeAll();
    } catch (error) {
      setError("Не удалось удалить туалет: " + error.message);
    }
  };

  // Открытие модального окна с деталями туалета
  const openToiletModal = (toilet) => {
    setActiveToilet(toilet);
    modals.open({
      title: `Туалет: ${toilet.name}`,
      size: "lg",
      centered: true,
      children: (
        <ModalContent
          toilet={toilet}
          userId={userId}
          onSubmit={(title, text, score) => submitReview(toilet.id, title, text, score)}
          onDelete={() => deleteToilet(toilet.id)}
          onClose={() => setActiveToilet(null)}
        />
      ),
    });
  };

  // Отправка отзыва о туалете
  const submitReview = async (toiletId, title, text, score) => {
    if (!title || !text || score === null) return;
    try {
      await api.post("/review/add", {
        toilet_id: toiletId,
        title,
        review_text: text,
        score,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      modals.closeAll();
      setActiveToilet(null);
    } catch (error) {
      setError("Ошибка при отправке отзыва: " + error.message);
    }
  };

  return (
    <Container fluid p="md">
      <Title order={2} mb="md">Карта туалетов</Title>
      {loading && <Loader />} 
      {error && <Alert color="red">{error}</Alert>}
      {errorMsg && <Alert color="red">{errorMsg}</Alert>}
      
      {!loading && !error && (
        <MapContainer
          toilets={toilets}
          position={position}
          onToiletClick={openToiletModal}
          onAddToilet={handleAddToilet}
        />
      )}
    </Container>
  );
}
