import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Brain, User } from 'lucide-react';

const DodgeGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [generation, setGeneration] = useState(1);
  const [aiScore, setAiScore] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  
  const gameRef = useRef({
    player: { x: 50, y: 200, width: 30, height: 30, speed: 5 },
    obstacles: [],
    obstacleSpeed: 3,
    obstacleTimer: 0,
    keys: {},
    // IA Q-Learning simple
    qTable: {},
    epsilon: 0.3,
    learningRate: 0.1,
    discountFactor: 0.9,
    lastState: null,
    lastAction: null
  });

  // Obtener estado discretizado para IA
  const getState = (player, obstacles) => {
    if (obstacles.length === 0) return 'safe';
    
    const nearest = obstacles.reduce((closest, obs) => 
      !closest || obs.x < closest.x ? obs : closest
    , null);
    
    const distX = Math.floor((nearest.x - player.x) / 50);
    const distY = Math.floor((nearest.y - player.y) / 50);
    const playerY = Math.floor(player.y / 50);
    
    return `${distX}_${distY}_${playerY}`;
  };

  // Obtener Q-value
  const getQValue = (state, action) => {
    const key = `${state}_${action}`;
    return gameRef.current.qTable[key] || 0;
  };

  // Actualizar Q-value
  const updateQValue = (state, action, reward, nextState) => {
    const key = `${state}_${action}`;
    const oldQ = getQValue(state, action);
    
    const maxNextQ = Math.max(
      getQValue(nextState, 'up'),
      getQValue(nextState, 'down'),
      getQValue(nextState, 'stay')
    );
    
    const newQ = oldQ + gameRef.current.learningRate * 
      (reward + gameRef.current.discountFactor * maxNextQ - oldQ);
    
    gameRef.current.qTable[key] = newQ;
  };

  // Elegir acción (epsilon-greedy)
  const chooseAction = (state) => {
    if (Math.random() < gameRef.current.epsilon) {
      const actions = ['up', 'down', 'stay'];
      return actions[Math.floor(Math.random() * actions.length)];
    }
    
    const qUp = getQValue(state, 'up');
    const qDown = getQValue(state, 'down');
    const qStay = getQValue(state, 'stay');
    
    if (qUp >= qDown && qUp >= qStay) return 'up';
    if (qDown >= qStay) return 'down';
    return 'stay';
  };

  // Ejecutar acción de IA
  const executeAIAction = (action, player) => {
    if (action === 'up' && player.y > 0) {
      player.y -= player.speed;
    } else if (action === 'down' && player.y < 370) {
      player.y += player.speed;
    }
  };

  // Calcular recompensa
  const calculateReward = (player, obstacles) => {
    // Recompensa por sobrevivir
    let reward = 1;
    
    // Penalización por estar cerca de los bordes
    if (player.y < 50 || player.y > 350) reward -= 0.5;
    
    // Bonificación por estar en posición central
    if (player.y > 150 && player.y < 250) reward += 0.5;
    
    return reward;
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'ai') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const game = gameRef.current;
    let animationId;
    let currentScore = 0;

    const update = () => {
      const isAIMode = gameState === 'ai';
      
      // Mover jugador (manual)
      if (!isAIMode) {
        if (game.keys['ArrowUp'] && game.player.y > 0) {
          game.player.y -= game.player.speed;
        }
        if (game.keys['ArrowDown'] && game.player.y < canvas.height - game.player.height) {
          game.player.y += game.player.speed;
        }
      } else {
        // Modo IA
        const state = getState(game.player, game.obstacles);
        const action = chooseAction(state);
        executeAIAction(action, game.player);
        
        // Q-Learning update
        if (game.lastState && game.lastAction) {
          const reward = calculateReward(game.player, game.obstacles);
          updateQValue(game.lastState, game.lastAction, reward, state);
        }
        
        game.lastState = state;
        game.lastAction = action;
      }

      // Crear obstáculos
      game.obstacleTimer++;
      if (game.obstacleTimer > 60) {
        const height = 30 + Math.random() * 50;
        const y = Math.random() * (canvas.height - height);
        game.obstacles.push({ x: canvas.width, y, width: 30, height });
        game.obstacleTimer = 0;
      }

      // Mover obstáculos
      game.obstacles = game.obstacles.filter(obs => {
        obs.x -= game.obstacleSpeed;
        return obs.x > -obs.width;
      });

      // Incrementar velocidad gradualmente
      if (currentScore % 10 === 0 && currentScore > 0) {
        game.obstacleSpeed = Math.min(3 + currentScore * 0.05, 8);
      }

      // Detectar colisiones
      const collision = game.obstacles.some(obs =>
        game.player.x < obs.x + obs.width &&
        game.player.x + game.player.width > obs.x &&
        game.player.y < obs.y + obs.height &&
        game.player.y + game.player.height > obs.y
      );

      if (collision) {
        if (isAIMode) {
          // Penalización fuerte por colisión
          if (game.lastState && game.lastAction) {
            updateQValue(game.lastState, game.lastAction, -100, getState(game.player, game.obstacles));
          }
          
          setAiScore(currentScore);
          setGeneration(g => g + 1);
          game.epsilon = Math.max(0.05, game.epsilon * 0.995); // Reducir exploración
          
          // Reset
          game.player.y = 200;
          game.obstacles = [];
          game.obstacleSpeed = 3;
          game.lastState = null;
          game.lastAction = null;
          currentScore = 0;
        } else {
          setGameState('gameOver');
          if (currentScore > highScore) {
            setHighScore(currentScore);
          }
        }
      }

      // Incrementar puntuación
      currentScore++;
      if (!isAIMode) {
        setScore(currentScore);
      }

      // Dibujar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Jugador
      ctx.fillStyle = isAIMode ? '#8b5cf6' : '#3b82f6';
      ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);

      // Obstáculos
      ctx.fillStyle = '#ef4444';
      game.obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      });

      // Puntuación
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${currentScore}`, 10, 30);
      
      if (isAIMode) {
        ctx.fillText(`Gen: ${generation}`, 10, 60);
        ctx.fillText(`Best: ${aiScore}`, 10, 90);
        ctx.fillText(`ε: ${game.epsilon.toFixed(3)}`, 10, 120);
      }

      animationId = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(animationId);
  }, [gameState, generation, aiScore, highScore]);

  // Controles de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = (mode) => {
    gameRef.current.player.y = 200;
    gameRef.current.obstacles = [];
    gameRef.current.obstacleSpeed = 3;
    gameRef.current.obstacleTimer = 0;
    setScore(0);
    setGameState(mode);
    
    if (mode === 'ai') {
      setIsTraining(true);
      gameRef.current.lastState = null;
      gameRef.current.lastAction = null;
    }
  };

  const stopTraining = () => {
    setGameState('menu');
    setIsTraining(false);
  };

  const resetAI = () => {
    gameRef.current.qTable = {};
    gameRef.current.epsilon = 0.3;
    setGeneration(1);
    setAiScore(0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-white">
          🎮 Dodge Game con IA
        </h1>
        <p className="text-center text-slate-300 mb-6">
          Juega manualmente o entrena una IA con Q-Learning
        </p>

        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="border-4 border-slate-600 rounded-lg mx-auto mb-6"
        />

        {gameState === 'menu' && (
          <div className="text-center space-y-4">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                onClick={() => startGame('playing')}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors"
              >
                <User size={20} />
                Jugar Manual
              </button>
              <button
                onClick={() => startGame('ai')}
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors"
              >
                <Brain size={20} />
                Entrenar IA
              </button>
            </div>
            
            <div className="bg-slate-700 p-4 rounded-lg max-w-md mx-auto">
              <h3 className="font-bold text-white mb-2">📊 Estadísticas</h3>
              <p className="text-slate-300">High Score Manual: {highScore}</p>
              <p className="text-slate-300">Best AI Score: {aiScore}</p>
              <p className="text-slate-300">Generación: {generation}</p>
              <p className="text-slate-300">Q-Table size: {Object.keys(gameRef.current.qTable).length}</p>
            </div>

            <button
              onClick={resetAI}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
            >
              <RotateCcw size={16} />
              Resetear IA
            </button>

            <div className="bg-slate-700 p-4 rounded-lg text-sm text-slate-300 max-w-md mx-auto">
              <p className="font-bold text-white mb-2">🎯 Instrucciones:</p>
              <p><strong>Modo Manual:</strong> Usa ↑ ↓ para esquivar obstáculos</p>
              <p><strong>Modo IA:</strong> La IA aprende automáticamente usando Q-Learning</p>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="text-center space-y-4">
            <div className="bg-slate-700 p-4 rounded-lg inline-block">
              <p className="text-2xl font-bold text-white">Puntuación: {score}</p>
              <p className="text-slate-300">High Score: {highScore}</p>
            </div>
            <p className="text-slate-300">Usa las flechas ↑ ↓ para moverte</p>
          </div>
        )}

        {gameState === 'ai' && (
          <div className="text-center space-y-4">
            <div className="bg-purple-900 p-4 rounded-lg inline-block">
              <p className="text-xl font-bold text-white">🤖 IA Entrenando...</p>
              <p className="text-purple-200">Generación: {generation}</p>
              <p className="text-purple-200">Mejor Score: {aiScore}</p>
            </div>
            <button
              onClick={stopTraining}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors mx-auto"
            >
              <Pause size={20} />
              Detener Entrenamiento
            </button>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-red-400">¡Game Over!</h2>
            <div className="bg-slate-700 p-4 rounded-lg inline-block">
              <p className="text-2xl font-bold text-white">Puntuación Final: {score}</p>
              {score > highScore && (
                <p className="text-yellow-400 font-bold">¡Nuevo Record!</p>
              )}
            </div>
            <button
              onClick={() => setGameState('menu')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Volver al Menú
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DodgeGame;