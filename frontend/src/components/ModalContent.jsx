import { useState, useEffect } from "react";
import { Button, Card, Stack, Text, TextInput, Textarea, Loader, Alert } from "@mantine/core";
import ReactStars from "react-stars";
import { modals } from "@mantine/modals";
import api from "../api";
import { RatingAndReviews } from "../components/RatingAndReviews";

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
