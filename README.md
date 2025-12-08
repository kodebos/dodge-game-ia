# 🎮 Dodge Game con IA

Videojuego de esquivar obstáculos con Inteligencia Artificial que aprende a jugar usando **Q-Learning**.

![Estado del Proyecto](https://img.shields.io/badge/estado-activo-success.svg)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue.svg)

## 🚀 Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/dodge-game-ia.git
cd dodge-game-ia

# Instalar dependencias
npm install

# Ejecutar
npm start
```

## 🎯 Características

- 🎮 **Modo Manual**: Juega usando las flechas ↑ ↓
- 🤖 **Modo IA**: Observa cómo la IA aprende automáticamente
- 📊 **Q-Learning**: Algoritmo de aprendizaje por refuerzo
- 📈 **Estadísticas en tiempo real**: Generación, score, epsilon
- ⚡ **Dificultad progresiva**: La velocidad aumenta con el tiempo

## 🧠 Cómo funciona la IA

La IA usa **Q-Learning**, un algoritmo que aprende la mejor acción para cada situación:

- **Estados**: Posición del jugador y distancia a obstáculos
- **Acciones**: Subir, bajar o quedarse quieto
- **Recompensas**: +1 por sobrevivir, -100 por colisión
- **Aprendizaje**: Mejora después de cada partida

```
Q(s,a) ← Q(s,a) + α[r + γ max Q(s',a') - Q(s,a)]
```

## 🛠️ Tecnologías

- React 18
- Tailwind CSS
- HTML5 Canvas
- JavaScript (Q-Learning)

## 📝 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles

---

⭐️ Si te gustó el proyecto, dale una estrella en GitHub
