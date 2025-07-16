import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
} from "react-leaflet";
import {
  Container,
  Title,
  Loader,
  Alert,
  Button,
  Stack,
  TextInput,
  Textarea,
  Text,
  Card,
  Select,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api";
import { useAuth } from "../hooks/useAuth";
import ReactStars from "react-stars";
import { parseJwt } from "../utils";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

// Custom icon for the user's current location
const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/731/731610.png',  // Set your custom icon URL here
  iconSize: [30, 30],  // Size of the icon
  iconAnchor: [15, 15],  // Anchor point of the icon
  popupAnchor: [0, -15],  // Position of the popup
});

// Hook for getting user's geolocation
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          setError("Не удалось получить ваше местоположение.");
        }
      );
    } else {
      setError("Геолокация не поддерживается вашим браузером.");
    }
  }, []);

  return { position, error };
}

export function MapClickHandler({ onClick }) {
  useMapEvent("click", onClick);
  return null;
}

export function RatingAndReviews({ reviews }) {
  const reviewList = Array.isArray(reviews) ? reviews : [];
  return (
    <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "10px" }}>
      {reviewList.length > 0 ? (
        reviewList.map((review, index) => (
          <Card key={index} shadow="sm" padding="lg" style={{ marginBottom: "10px" }}>
            <Text weight={500}>{review.title}</Text>
            <Text size="sm" style={{ margin: "10px 0" }}>{review.review_text}</Text>
            <Text size="sm" color="dimmed">Оценка: {review.score}</Text>
            <Text size="xs" color="dimmed" style={{ marginTop: "10px" }}>
              <strong>Дата отзыва:</strong> {new Date(review.created_at).toLocaleString()}
            </Text>
          </Card>
        ))
      ) : (
        <Text>Нет отзывов</Text>
      )}
    </div>
  );
}

export function ModalAddToilet({ lat, lng, onSubmit, onClose }) {
  const [name, setName] = useState("");
  const [toiletType, setToiletType] = useState("male"); // Стейт для типа туалета

  const handleSubmit = () => {
    onSubmit(name, toiletType); // Передаем имя туалета и тип
  };

  return (
    <Stack>
      <TextInput
        label="Название туалета"
        placeholder="Введите название"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
      />
      <Select
        label="Тип туалета"
        placeholder="Выберите тип"
        value={toiletType}
        onChange={setToiletType}
        data={[
          { value: 'male', label: 'Мужской' },
          { value: 'female', label: 'Женский' },
        ]}
        style={{ zIndex: 9999 }}
      />
      <Button fullWidth onClick={handleSubmit}>Добавить туалет</Button>
      <Button fullWidth variant="outline" onClick={onClose}>Закрыть</Button>
    </Stack>
  );
}

export function ModalContent({ toilet, userId, onSubmit, onDelete, onClose }) {
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [score, setScore] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get(`/toilet/${toilet.id}/reviews`);
        setReviews(response.data);
      } catch (err) {
        setError("Ошибка при загрузке отзывов");
        console.error(err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [toilet.id]);

  const isOwner = toilet.founder_id === userId;

  const confirmDelete = () => {
    modals.openConfirmModal({
      title: "Удалить туалет?",
      children: <Text size="sm">Вы уверены, что хотите удалить этот туалет?</Text>,
      labels: { confirm: "Удалить", cancel: "Отмена" },
      confirmProps: { color: "red" },
      onConfirm: onDelete,
    });
  };

  return (
    <Stack px="md">
      <Text size="sm" color="dimmed">Координаты: {toilet.point}</Text>
      <Text size="sm" color="dimmed">Тип туалета: {toilet.type === 'male' ? 'Мужской' : 'Женский'}</Text>

      {loadingReviews && <Loader />}
      {error && <Alert color="red">{error}</Alert>}
      <RatingAndReviews reviews={reviews} />

      <TextInput
        label="Заголовок отзыва"
        value={reviewTitle}
        onChange={(e) => setReviewTitle(e.currentTarget.value)}
      />
      <Textarea
        label="Текст отзыва"
        value={reviewText}
        onChange={(e) => setReviewText(e.currentTarget.value)}
        autosize minRows={3}
      />
      <Text size="sm">Оцените туалет:</Text>
      <ReactStars count={5} value={score} onChange={setScore} size={24} color2="#ffd700" />

      <Button fullWidth onClick={() => {
        onSubmit(reviewTitle, reviewText, score);
        setReviewTitle("");
        setReviewText("");
        setScore(0);
      }}>Отправить отзыв</Button>

      {isOwner && <Button color="red" fullWidth onClick={confirmDelete}>Удалить туалет</Button>}

      <Button fullWidth variant="outline" onClick={onClose}>Закрыть</Button>
    </Stack>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const { position, error } = useGeolocation(); // Получаем текущие координаты
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setError] = useState("");
  const [activeToilet, setActiveToilet] = useState(null);
  const userId = parseJwt(token)?.user_id;

  useEffect(() => {
    api.get("/toilets")
      .then((res) => setToilets(res.data))
      .catch(() => setError("Не удалось загрузить туалеты"))
      .finally(() => setLoading(false));
  }, []);

  // Обработчик добавления туалета
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

  // Отправка нового туалета на сервер
  const submitNewToilet = async (name, lat, lng, toiletType) => {
    try {
      const response = await api.post("/toilet/add", {
        name,
        point: `${lat},${lng}`,
        type: toiletType, // Добавляем тип туалета
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
    } catch {
      alert("Ошибка при добавлении туалета");
    }
  };

  const deleteToilet = async (id) => {
    try {
      await api.delete("/toilet/delete", {
        data: { id },
        headers: { Authorization: `Bearer ${token}` },
      });

      setToilets((prev) => prev.filter((t) => t.id !== id));
      modals.closeAll();
    } catch {
      alert("Не удалось удалить туалет");
    }
  };

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
    } catch {
      alert("Ошибка при отправке отзыва");
    }
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    handleAddToilet(lat, lng);
  };

  return (
    <Container fluid p="md">
      <Title order={2} mb="md">Карта туалетов</Title>
      {loading && <Loader />} 
      {error && <Alert color="red">{error}</Alert>}
      {errorMsg && <Alert color="red">{errorMsg}</Alert>}
      
      {!loading && !error && (
        <MapContainer center={position ? [position.lat, position.lng] : [55.75, 37.61]} zoom={12} style={{ height: 600 }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapClickHandler onClick={handleMapClick} />
          
          {/* Marker for the user's current location with a custom icon */}
          {position && (
            <Marker position={[position.lat, position.lng]} icon={userIcon}>
              <Popup>Это ваша текущая локация</Popup>
            </Marker>
          )}

          {toilets && Array.isArray(toilets) && toilets.length > 0 ? (
            toilets.map((toilet) => {
              const point = toilet.point?.split(',').map(parseFloat);
              if (!point || point.length !== 2 || point.some(isNaN)) return null;
              return (
                <Marker
                  key={toilet.id}
                  position={point}
                  eventHandlers={{ click: () => openToiletModal(toilet) }}
                />
              );
            })
          ) : (
            <p>Нет туалетов для отображения.</p>
          )}
        </MapContainer>
      )}
    </Container>
  );
}
