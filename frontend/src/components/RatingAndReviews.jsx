import { Card, Text } from "@mantine/core";

export function RatingAndReviews({ reviews }) {
  const reviewList = Array.isArray(reviews) ? reviews : [];
  return (
    <div
      style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "10px" }}
    >
      {reviewList.length > 0 ? (
        reviewList.map((review, index) => (
          <Card
            key={index}
            shadow="sm"
            padding="lg"
            style={{ marginBottom: "10px" }}
          >
            <Text weight={500}>{review.title}</Text>
            <Text size="sm" style={{ margin: "10px 0" }}>
              {review.review_text}
            </Text>
            <Text size="sm" color="dimmed">
              Оценка: {review.score}
            </Text>
            <Text size="xs" color="dimmed" style={{ marginTop: "10px" }}>
              <strong>Дата отзыва:</strong>{" "}
              {new Date(review.created_at).toLocaleString()}
            </Text>
          </Card>
        ))
      ) : (
        <Text>Нет отзывов</Text>
      )}
    </div>
  );
}
