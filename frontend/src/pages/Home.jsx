import React, { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  List,
  Loader,
  Paper,
  ScrollArea,
} from "@mantine/core";
import { ToiletMap } from "../components/ToiletMap";

export default function Home() {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/toilets")
      .then((res) => res.json())
      .then((data) => {
        setToilets(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Container size="md" py="md">
      <Title align="center" mb="md">
        Free Toilet Map
      </Title>

      <Paper shadow="sm" padding="md" mb="md" style={{ height: 300 }}>
        <ToiletMap toilets={toilets} />
      </Paper>

      <Title order={2} mb="sm">
        Список туалетов
      </Title>

      {loading ? (
        <Loader />
      ) : toilets.length === 0 ? (
        <Text align="center">Туалеты не найдены</Text>
      ) : (
        <ScrollArea style={{ height: 300 }}>
          <List withPadding>
            {toilets.map((t) => (
              <List.Item key={t.id}>
                <b>{t.name}</b> — Координаты: {t.point}
              </List.Item>
            ))}
          </List>
        </ScrollArea>
      )}
    </Container>
  );
}
