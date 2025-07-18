import { useState } from "react";
import { Stack, TextInput, Select, Button } from "@mantine/core";

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
