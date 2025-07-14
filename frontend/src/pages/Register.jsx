// src/pages/Register.jsx
import { useState } from "react";
import {
  Container,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Group,
  Text,
  Anchor,
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
      const res = await fetch("http://localhost:8080/user/create", {
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
      <Paper p="xl" shadow="md" radius="md">
        <Title align="center" mb="md">Регистрация</Title>

        <TextInput
          label="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          required
          mb="sm"
        />
        <PasswordInput
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          required
          mb="md"
        />

        <Group position="apart" mb="md">
          <Text size="sm">
            Уже есть аккаунт?{" "}
            <Anchor href="/login" size="sm">Войти</Anchor>
          </Text>
        </Group>

        <Button fullWidth onClick={handleRegister}>
          Создать аккаунт
        </Button>
      </Paper>
    </Container>
  );
}
