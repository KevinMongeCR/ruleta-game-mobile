import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Player,
  crearCodigoSala,
  crearJugadoresIniciales,
  iniciarPartidaLogic,
  aplicarResultadoRuleta,
  opcionesRuleta,
} from '../utils/gameLogic';

type Props = {
  route: any;
  navigation: any;
};

const GameScreen = ({route, navigation}: Props) => {
  const {nickname, avatar} = route.params;

  const initialPlayers: Player[] = crearJugadoresIniciales(nickname, avatar);

  const [roomCode, setRoomCode] = useState(crearCodigoSala());
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [pot, setPot] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [resultado, setResultado] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);
  const [winner, setWinner] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );
  const [isSpinning, setIsSpinning] = useState(false);

  const iniciarPartida = () => {
    if (gameStarted) {
      return;
    }

    const {updatedPlayers, newPot, resultado: resultadoInicio} =
      iniciarPartidaLogic(players);

    setPlayers(updatedPlayers);
    setPot(newPot);
    setGameStarted(true);
    setGameOver(false);
    setTurnIndex(0);
    setWinner('');
    setResultado(resultadoInicio);
    setSelectedOptionIndex(null);
    setHistory([
      `La partida inició en la sala ${roomCode}. Todos aportaron 1 moneda. Pozo inicial: ${newPot}`,
    ]);
  };

  const girarRuleta = () => {
    if (!gameStarted || gameOver || isSpinning) {
      return;
    }

    const jugadorActual = players[turnIndex];
    const finalIndex = Math.floor(Math.random() * opcionesRuleta.length);
    const finalOption = opcionesRuleta[finalIndex];

    setIsSpinning(true);

    let currentStep = 0;
    const totalSteps = 12 + finalIndex;

    const interval = setInterval(() => {
      const currentIndex = currentStep % opcionesRuleta.length;
      setSelectedOptionIndex(currentIndex);
      currentStep++;

      if (currentStep > totalSteps) {
        clearInterval(interval);

        const {
          updatedPlayers,
          newPot,
          opcion,
          newGameOver,
          nextTurn,
          winner: winnerName,
        } = aplicarResultadoRuleta(players, pot, turnIndex, finalOption);

        setPlayers(updatedPlayers);
        setPot(newPot);
        setResultado(opcion);
        setSelectedOptionIndex(finalIndex);
        setGameOver(newGameOver);
        setTurnIndex(nextTurn);
        setWinner(winnerName);
        setIsSpinning(false);

        const newEntry = `${jugadorActual.avatar} ${jugadorActual.nickname} obtuvo: ${opcion}. Pozo: ${newPot}`;

        if (newGameOver && winnerName) {
          setHistory(prev => [
            ...prev,
            newEntry,
            `🏆 Ganador de la sala ${roomCode}: ${winnerName}`,
          ]);
        } else {
          setHistory(prev => [...prev, newEntry]);
        }
      }
    }, 120);
  };

  const reiniciarPartida = () => {
    if (isSpinning) {
      return;
    }

    setPlayers(crearJugadoresIniciales(nickname, avatar));
    setPot(0);
    setGameStarted(false);
    setResultado('');
    setGameOver(false);
    setTurnIndex(0);
    setWinner('');
    setHistory([]);
    setSelectedOptionIndex(null);
    setRoomCode(crearCodigoSala());
  };

  const volverAlInicio = () => {
    if (isSpinning) {
      return;
    }

    navigation.navigate('LoginScreen');
  };

  const currentPlayer = players[turnIndex];
  const mainPlayer = players[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ruleta Game</Text>

      <View style={styles.roomBox}>
        <Text style={styles.roomTitle}>Sala</Text>
        <Text style={styles.roomCode}>{roomCode}</Text>
        <Text style={styles.roomInfo}>Jugadores conectados: {players.length}</Text>
        <Text style={styles.roomInfo}>
          Tu perfil: {mainPlayer.avatar} {mainPlayer.nickname}
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Pozo principal: {pot}</Text>
        <Text style={styles.infoText}>
          Estado:{' '}
          {gameOver
            ? 'Juego terminado'
            : gameStarted
            ? 'Partida iniciada'
            : 'Esperando inicio'}
        </Text>

        {gameStarted && !gameOver && currentPlayer ? (
          <Text style={styles.turnText}>
            Turno de: {currentPlayer.avatar} {currentPlayer.nickname}
          </Text>
        ) : null}

        {gameOver && winner ? (
          <Text style={styles.winnerText}>Ganador: {winner}</Text>
        ) : null}

        <Text style={styles.resultText}>
          Resultado: {resultado || 'Sin giro todavía'}
        </Text>
      </View>

      <View style={styles.wheelBox}>
        <Text style={styles.sectionTitle}>Ruleta</Text>
        <View style={styles.wheelGrid}>
          {opcionesRuleta.map((item, index) => (
            <View
              key={index}
              style={[
                styles.wheelOption,
                selectedOptionIndex === index ? styles.wheelOptionSelected : null,
              ]}>
              <Text
                style={[
                  styles.wheelOptionText,
                  selectedOptionIndex === index
                    ? styles.wheelOptionTextSelected
                    : null,
                ]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.playersBox}>
        <Text style={styles.sectionTitle}>Jugadores</Text>
        {players.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.playerRow,
              index === turnIndex && gameStarted && !gameOver
                ? styles.activePlayerRow
                : null,
            ]}>
            <Text style={styles.playerText}>
              {player.avatar} {player.nickname} - Monedas: {player.coins}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.historyBox}>
        <Text style={styles.sectionTitle}>Historial</Text>
        {history.length === 0 ? (
          <Text style={styles.historyText}>Sin movimientos todavía</Text>
        ) : (
          history.map((item, index) => (
            <Text key={index} style={styles.historyText}>
              • {item}
            </Text>
          ))
        )}
      </View>

      {!gameStarted ? (
        <TouchableOpacity style={styles.button} onPress={iniciarPartida}>
          <Text style={styles.buttonText}>Iniciar partida</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.button,
            (gameOver || isSpinning) && styles.buttonDisabled,
          ]}
          onPress={girarRuleta}
          disabled={gameOver || isSpinning}>
          <Text style={styles.buttonText}>
            {gameOver
              ? 'Juego finalizado'
              : isSpinning
              ? 'Girando...'
              : 'Girar ruleta'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.resetButton, isSpinning && styles.buttonDisabled]}
        onPress={reiniciarPartida}
        disabled={isSpinning}>
        <Text style={styles.buttonText}>Reiniciar partida</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.backButton, isSpinning && styles.buttonDisabled]}
        onPress={volverAlInicio}
        disabled={isSpinning}>
        <Text style={styles.buttonText}>Volver al inicio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default GameScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F5F7FB',
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 20,
  },
  roomBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D9E1F2',
  },
  roomTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  roomCode: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#355DA8',
    marginBottom: 10,
    letterSpacing: 2,
  },
  roomInfo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 6,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D9E1F2',
  },
  infoText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  turnText: {
    fontSize: 20,
    marginTop: 5,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#355DA8',
  },
  winnerText: {
    fontSize: 22,
    marginTop: 5,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1E8449',
  },
  resultText: {
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  wheelBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D9E1F2',
  },
  wheelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wheelOption: {
    width: '48%',
    backgroundColor: '#EEF3FF',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C9D8F2',
  },
  wheelOptionSelected: {
    backgroundColor: '#355DA8',
    borderColor: '#355DA8',
  },
  wheelOptionText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2D3D',
  },
  wheelOptionTextSelected: {
    color: '#FFFFFF',
  },
  playersBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D9E1F2',
  },
  historyBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#D9E1F2',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  playerRow: {
    marginBottom: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activePlayerRow: {
    backgroundColor: '#DCE8FF',
  },
  playerText: {
    fontSize: 18,
    textAlign: 'center',
  },
  historyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#355DA8',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    alignSelf: 'center',
  },
  resetButton: {
    backgroundColor: '#C0392B',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    alignSelf: 'center',
  },
  backButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#7E9ACF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});