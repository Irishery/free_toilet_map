import React, { useState } from "react";
import {
  Container,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Text,
  Anchor,
  Paper,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { showNotification } from "@mantine/notifications";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !password) {
      showNotification({ color: "red", message: "Введите имя и пароль" });
      return;
    }
    try {
      const res = await fetch("/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Ошибка регистрации");
      showNotification({ color: "green", message: "Пользователь создан" });
      navigate("/login");
    } catch {
      showNotification({ color: "red", message: "Ошибка при регистрации" });
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper padding="xl" shadow="md" radius="md">
        <Title align="center" mb="md">
          Регистрация
        </Title>

        <TextInput
          label="Имя пользователя"
          placeholder="Введите имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          required
          mb="sm"
        />
        <PasswordInput
          label="Пароль"
          placeholder="Введите пароль"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          required
          mb="md"
        />
        <Group position="apart" mb="md">
          <Text size="sm">
            Уже есть аккаунт?{" "}
            <Anchor href="/login" size="sm">
              Войти
            </Anchor>
          </Text>
        </Group>
        <Button fullWidth onClick={handleRegister}>
          Создать аккаунт
        </Button>
      </Paper>
    </Container>
  );
}
