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

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      showNotification({ color: "red", message: "Введите имя и пароль" });
      return;
    }
    try {
      const res = await fetch("/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Ошибка авторизации");
      showNotification({ color: "green", message: "Успешный вход" });
      navigate("/");
    } catch {
      showNotification({ color: "red", message: "Неверные данные" });
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper padding="xl" shadow="md" radius="md">
        <Title align="center" mb="md">
          Вход
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
            Нет аккаунта?{" "}
            <Anchor href="/register" size="sm">
              Зарегистрироваться
            </Anchor>
          </Text>
        </Group>
        <Button fullWidth onClick={handleLogin}>
          Войти
        </Button>
      </Paper>
    </Container>
  );
}
