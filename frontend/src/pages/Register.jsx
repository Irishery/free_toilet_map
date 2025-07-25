import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const animationRef = useRef(null); // Для хранения requestAnimationFrame ID

  const handleRegister = async () => {
    const apiUrl = process.env.VITE_API_URL || "http://localhost:8080";

    if (!username || !password) {
      alert("Введите имя и пароль");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/user/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Ошибка регистрации");

      alert("Пользователь создан");

      navigate("/login");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    scene.background = new THREE.Color(0x000000);

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    let toilet;
    let baseScale = 2;
    let scaleDirection = 0.005;
    let scaleMin = 1.5;
    let scaleMax = 2.5;

    loader.load(
      "/models/toilet.glb",
      (gltf) => {
        toilet = gltf.scene;
        scene.add(toilet);
        toilet.scale.set(baseScale, baseScale, baseScale);
      },
      undefined,
      (error) => {
        console.error("GLTF Model Loading Error:", error);
        alert("Error loading the 3D model.");
      }
    );

    camera.position.z = 5;

    const handleResize = () => {
      if (renderer && camera) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
    };

    window.addEventListener("resize", handleResize);

    const SPEED_MULTIPLIER = 5;

    let velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02 * SPEED_MULTIPLIER,
      (Math.random() - 0.5) * 0.02 * SPEED_MULTIPLIER,
      (Math.random() - 0.5) * 0.01 * SPEED_MULTIPLIER
    );

    const animate = function () {
      animationRef.current = requestAnimationFrame(animate);

      if (toilet) {
        // Rotate the toilet
        toilet.rotation.y += 0.01;

        // Move the toilet
        toilet.position.add(velocity);

        // Изменение размера модели (пульсация)
        baseScale += scaleDirection;

        if (baseScale > scaleMax || baseScale < scaleMin) {
          scaleDirection *= -1;
        }

        toilet.scale.set(baseScale, baseScale, baseScale);

        // Get bounding box of the toilet
        const box = new THREE.Box3().setFromObject(toilet);
        const center = box.getCenter(new THREE.Vector3());

        // Convert 3D position to screen coordinates for boundary checking
        const screenPosition = center.clone().project(camera);

        // Convert to screen space coordinates
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const screenX = (screenPosition.x * screenWidth) / 2 + screenWidth / 2;
        const screenY =
          -((screenPosition.y * screenHeight) / 2) + screenHeight / 2;

        // Check boundaries and reverse direction
        const margin = 50;

        if (screenX < margin || screenX > screenWidth - margin) {
          velocity.x *= -1;
        }

        if (screenY < margin || screenY > screenHeight - margin) {
          velocity.y *= -1;
        }

        if (toilet.position.z > 3 || toilet.position.z < -3) {
          velocity.z *= -1;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      // Останавливаем анимацию
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      window.removeEventListener("resize", handleResize);

      // Удаляем все объекты Three.js
      if (toilet) {
        scene.remove(toilet);
        toilet.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((material) => {
                  if (material.dispose) material.dispose();
                });
              } else {
                if (child.material.dispose) child.material.dispose();
              }
            }
          }
        });
      }

      // Очищаем сцену
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }

      // Освобождаем ресурсы рендерера
      if (renderer) {
        renderer.dispose();
      }

      // Удаляем canvas элемент
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }

      // Очищаем ссылки
      canvasRef.current = null;
    };
  }, []);

  return (
    <div className="relative flex min-h-screen justify-center items-center">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-0"
      />

      <div className="container mx-auto px-4 max-w-xs z-10">
        <div className="bg-transparent p-8 w-full">
          <h2 className="text-2xl font-bold text-center mb-8 text-white">
            Регистрация
          </h2>

          <div className="flex flex-col space-y-4">
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium">
                Имя пользователя
              </label>
              <input
                type="text"
                placeholder="Введите ваше имя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-white text-sm font-medium">
                Пароль
              </label>
              <input
                type="password"
                placeholder="Введите ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors duration-200 mt-4 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="ml-2">Загрузка...</span>
                </div>
              ) : (
                "Зарегистрироваться"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
