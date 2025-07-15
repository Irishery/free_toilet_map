import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Container, Title, Loader, Alert, Button, Stack, TextInput, Textarea, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api";
import { useAuth } from "../hooks/useAuth";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

// Компонент для отображения рейтинга и отзывов
// Компонент для отображения рейтинга и отзывов
function RatingAndReviews({ reviews }) {
  const reviewList = Array.isArray(reviews) ? reviews : [];

  return (
    <div>
      <strong>Отзывы:</strong>
      <ul>
        {reviewList.length > 0 ? (
          reviewList.map((review, index) => (
            <li key={index}>
              <strong>{review.title}</strong>
              <p>{review.review_text}</p>
              <div>Оценка: {review.score}</div>
            </li>
          ))
        ) : (
          <li>Нет отзывов</li>
        )}
      </ul>
    </div>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeToilet, setActiveToilet] = useState(null); // Состояние активного туалета
  
  useEffect(() => {
    api
      .get("/toilets")
      .then((res) => setToilets(res.data))
      .catch(() => setError("Не удалось загрузить туалеты"))
      .finally(() => setLoading(false));
  }, []);

  const openToiletModal = (toilet) => {
    setActiveToilet(toilet); // Устанавливаем активный туалет

    modals.open({
      title: `Туалет: ${toilet.name}`,
      size: "lg",
      centered: true,
      key: toilet.id, // Добавление уникального ключа для каждой модалки
      children: (
        <ModalContent
          toilet={toilet}
          onSubmit={(title, text) => submitReview(toilet.id, title, text)}
          onClose={() => {
            setActiveToilet(null); // Сброс активного туалета при закрытии модалки
            modals.closeAll(); // Закрыть все модалки
          }}
        />
      ),
    });
  };

  const submitReview = async (toiletId, title, text) => {
    if (!title || !text) return;

    try {
      await api.post(
        "/review/add",
        {
          toilet_id: toiletId,
          title,
          review_text: text,
          score: 5,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      modals.closeAll(); // Закрываем все модалки после успешной отправки
      setActiveToilet(null); // Сброс активного туалета
    } catch {
      alert("Ошибка при отправке отзыва");
    }
  };

  return (
    <Container fluid p="md">
      <Title order={2} mb="md">Карта туалетов</Title>

      {loading && <Loader />}
      {error && <Alert color="red">{error}</Alert>}

      {!loading && !error && (
        <MapContainer center={[55.75, 37.61]} zoom={12} style={{ height: 600 }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {toilets.map((toilet) => {
            const [lat, lng] = toilet.point.split(",").map(parseFloat);
            return (
              <Marker
                key={toilet.id}
                position={[lat, lng]}
                eventHandlers={{
                  click: () => openToiletModal(toilet), // Открываем модалку при клике
                }}
              />
            );
          })}
        </MapContainer>
      )}
    </Container>
  );
}

function ModalContent({ toilet, onSubmit, onClose }) {
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reviews asynchronously using useEffect
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get(`/toilet/${toilet.id}/reviews`);
        setReviews(response.data); // Assuming response data contains the reviews
      } catch (err) {
        setError("Ошибка при загрузке отзывов");
        console.error(err);
      } finally {
        setLoadingReviews(false); // stop loading once the request is done
      }
    };

    fetchReviews();
  }, [toilet.id]); // Dependency array ensures fetch happens when the toilet id changes

  return (
    <Stack>
      <Text size="sm" color="dimmed">
        Координаты: {toilet.point}
      </Text>

      {/* Handle loading and error */}
      {loadingReviews && <Loader />}
      {error && <Alert color="red">{error}</Alert>}

      {/* Display reviews */}
      <RatingAndReviews reviews={reviews} />

      <TextInput
        label="Заголовок отзыва"
        placeholder="Например: Чисто и удобно"
        value={reviewTitle}
        onChange={(e) => setReviewTitle(e.currentTarget.value)}
      />

      <Textarea
        label="Текст отзыва"
        placeholder="Напишите подробнее..."
        value={reviewText}
        onChange={(e) => setReviewText(e.currentTarget.value)}
        autosize
        minRows={3}
      />

      <Button fullWidth onClick={() => onSubmit(reviewTitle, reviewText)}>
        Отправить отзыв
      </Button>
      <Button fullWidth variant="outline" onClick={onClose}>Закрыть</Button>
    </Stack>
  );
}
