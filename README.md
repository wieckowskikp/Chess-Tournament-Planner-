# Chess Tournament Planner

Kompleksowa aplikacja webowa do zarządzania turniejami szachowymi w systemie szwajcarskim z obsługą rankingu ELO.

## Przegląd projektu

Chess Tournament Planner to zaawansowane narzędzie stworzone, aby uprościć proces organizacji i zarządzania turniejami szachowymi. System obsługuje automatyczne kojarzenie par w systemie szwajcarskim, dynamiczną aktualizację rankingów ELO, zarządzanie uczestnikami oraz kompleksową analizę danych turniejowych.

### Główne funkcjonalności

- **Automatyczne kojarzenie par**: Zaawansowany algorytm kojarzenia w systemie szwajcarskim zapewniający sprawiedliwe i konkurencyjne zestawienia.
- **System rankingowy ELO**: Automatyczna aktualizacja rankingów ELO na podstawie wyników partii.
- **Kompleksowe zarządzanie turniejami**: Tworzenie, edycja i zarządzanie turniejami, rundami i partiami.
- **Analityka danych**: Szczegółowa analiza wydajności graczy, trendów turniejowych i statystyk.
- **Kontrola dostępu oparta na rolach**: Zróżnicowany poziom dostępu dla administratorów, organizatorów, graczy i kibiców.

## Technologie

- **Backend**: Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA
- **Baza danych**: MySQL
- **ORM**: Hibernate
- **Dokumentacja API**: Swagger/OpenAPI
- **Bezpieczeństwo**: JWT dla autentykacji i autoryzacji
- **Migracja danych**: Flyway

## Architektura aplikacji

Aplikacja jest zbudowana zgodnie z paradygmatem REST, wykorzystując warstwową architekturę:

1. **Kontrolery** - obsługa żądań HTTP i przekazywanie do warstwy serwisowej
2. **Serwisy** - implementacja logiki biznesowej
3. **Repozytoria** - dostęp do bazy danych
4. **DTO** - obiekty transferu danych między warstwami
5. **Modele** - encje persystentne

## Role użytkowników

System obsługuje następujące role z różnymi poziomami dostępu:

- **Administrator**: Pełny dostęp do systemu, zarządzanie użytkownikami i konfiguracją
- **Organizator**: Tworzenie i zarządzanie turniejami, rejestracja graczy, wprowadzanie wyników
- **Gracz**: Uczestnictwo w turniejach, przeglądanie statystyk i wyników własnych
- **Kibic**: Dostęp tylko do odczytu informacji o turniejach, partiach i wynikach

## API Endpoints

### Zarządzanie użytkownikami
- `POST /api/v1/auth/register` - Rejestracja nowego użytkownika
- `POST /api/v1/auth/login` - Logowanie i uzyskanie tokenu JWT
- `GET /api/v1/users` - Pobieranie listy użytkowników (tylko admin)
- `GET /api/v1/users/{id}` - Pobieranie szczegółów użytkownika
- `PUT /api/v1/users/{id}` - Aktualizacja informacji o użytkowniku
- `DELETE /api/v1/users/{id}` - Usunięcie użytkownika (tylko admin)

### Zarządzanie graczami
- `GET /api/v1/players` - Pobieranie listy graczy
- `GET /api/v1/players/{id}` - Pobieranie szczegółów gracza
- `GET /api/v1/players/{id}/tournaments` - Pobieranie turniejów gracza
- `GET /api/v1/players/{id}/matches` - Pobieranie partii gracza
- `PUT /api/v1/players/{id}/elo` - Aktualizacja rankingu ELO (tylko admin/organizator)

### Zarządzanie turniejami
- `POST /api/v1/tournaments` - Utworzenie nowego turnieju (tylko organizator/admin)
- `GET /api/v1/tournaments` - Pobieranie listy turniejów
- `GET /api/v1/tournaments/{id}` - Pobieranie szczegółów turnieju
- `PUT /api/v1/tournaments/{id}` - Aktualizacja informacji o turnieju (tylko organizator/admin)
- `DELETE /api/v1/tournaments/{id}` - Usunięcie turnieju (tylko organizator/admin)
- `POST /api/v1/tournaments/{id}/players` - Dodanie gracza do turnieju
- `DELETE /api/v1/tournaments/{id}/players/{playerId}` - Usunięcie gracza z turnieju
- `GET /api/v1/tournaments/{id}/standings` - Pobieranie klasyfikacji turnieju
- `POST /api/v1/tournaments/{id}/rounds` - Utworzenie nowej rundy

### Zarządzanie rundami
- `GET /api/v1/tournaments/{tournamentId}/rounds` - Pobieranie rund turnieju
- `GET /api/v1/rounds/{id}` - Pobieranie szczegółów rundy
- `PUT /api/v1/rounds/{id}` - Aktualizacja informacji o rundzie
- `POST /api/v1/rounds/{id}/pairings` - Generowanie par dla rundy (system szwajcarski)
- `GET /api/v1/rounds/{id}/matches` - Pobieranie partii rundy

### Zarządzanie partiami
- `GET /api/v1/matches/{id}` - Pobieranie szczegółów partii
- `PUT /api/v1/matches/{id}/result` - Aktualizacja wyniku partii (tylko organizator/admin)

### Analityka i statystyki
- `GET /api/v1/players/{id}/stats` - Statystyki gracza
- `GET /api/v1/tournaments/{id}/stats` - Statystyki turnieju

## Algorytm kojarzenia par w systemie szwajcarskim

Implementacja systemu szwajcarskiego w aplikacji uwzględnia:

1. Unikanie powtórnych par w tym samym turnieju
2. Parowanie graczy z podobną liczbą punktów
3. Sprawiedliwe przydzielanie kolorów (bilans białych/czarnych)
4. Obsługę nieparzystej liczby graczy (bye)
5. Różne kryteria tie-breakerów:
   - Buchholz
   - Sonneborn-Berger
   - Bezpośredni pojedynek
   - Większa liczba zwycięstw
   - Większa liczba zwycięstw czarnymi

## System rankingowy ELO

System wykorzystuje klasyczny algorytm ELO do aktualizacji rankingów graczy:

1. Obliczenie oczekiwanego wyniku na podstawie różnicy rankingów
2. Aktualizacja rankingu w oparciu o rzeczywisty wynik i współczynnik K
3. Możliwość konfiguracji współczynnika K dla różnych poziomów rankingowych

## Struktóra folderów i plików
```
chess-tournament-planner/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── chesstournament/
│   │   │           ├── ChessTournamentPlannerApplication.java
│   │   │           ├── config/
│   │   │           │   ├── SecurityConfig.java
│   │   │           │   ├── WebConfig.java
│   │   │           │   └── SwaggerConfig.java
│   │   │           ├── controller/
│   │   │           │   ├── UserController.java
│   │   │           │   ├── PlayerController.java
│   │   │           │   ├── TournamentController.java
│   │   │           │   ├── RoundController.java
│   │   │           │   ├── MatchController.java
│   │   │           │   └── StandingController.java
│   │   │           ├── dto/
│   │   │           │   ├── request/
│   │   │           │   │   ├── UserRequest.java
│   │   │           │   │   ├── PlayerRequest.java
│   │   │           │   │   ├── TournamentRequest.java
│   │   │           │   │   ├── RoundRequest.java
│   │   │           │   │   └── MatchRequest.java
│   │   │           │   └── response/
│   │   │           │       ├── UserResponse.java
│   │   │           │       ├── PlayerResponse.java
│   │   │           │       ├── TournamentResponse.java
│   │   │           │       ├── RoundResponse.java
│   │   │           │       ├── MatchResponse.java
│   │   │           │       ├── StandingResponse.java
│   │   │           │       └── PairingResponse.java
│   │   │           ├── exception/
│   │   │           │   ├── GlobalExceptionHandler.java
│   │   │           │   ├── ResourceNotFoundException.java
│   │   │           │   ├── InvalidOperationException.java
│   │   │           │   └── AuthorizationException.java
│   │   │           ├── model/
│   │   │           │   ├── User.java
│   │   │           │   ├── Player.java
│   │   │           │   ├── Tournament.java
│   │   │           │   ├── Round.java
│   │   │           │   ├── Match.java
│   │   │           │   ├── PlayerStanding.java
│   │   │           │   ├── TieBreaker.java
│   │   │           │   └── enums/
│   │   │           │       ├── Role.java
│   │   │           │       ├── TournamentStatus.java
│   │   │           │       ├── RoundStatus.java
│   │   │           │       ├── MatchResult.java
│   │   │           │       └── TieBreakerType.java
│   │   │           ├── repository/
│   │   │           │   ├── UserRepository.java
│   │   │           │   ├── PlayerRepository.java
│   │   │           │   ├── TournamentRepository.java
│   │   │           │   ├── RoundRepository.java
│   │   │           │   ├── MatchRepository.java
│   │   │           │   ├── PlayerStandingRepository.java
│   │   │           │   └── TieBreakerRepository.java
│   │   │           ├── security/
│   │   │           │   ├── JwtTokenProvider.java
│   │   │           │   ├── JwtAuthenticationFilter.java
│   │   │           │   └── CustomUserDetailsService.java
│   │   │           └── service/
│   │   │               ├── UserService.java
│   │   │               ├── PlayerService.java
│   │   │               ├── TournamentService.java
│   │   │               ├── RoundService.java
│   │   │               ├── MatchService.java
│   │   │               ├── StandingService.java
│   │   │               ├── EloRatingService.java
│   │   │               ├── SwissPairingService.java
│   │   │               ├── TieBreakerService.java
│   │   │               └── impl/
│   │   │                   ├── UserServiceImpl.java
│   │   │                   ├── PlayerServiceImpl.java
│   │   │                   ├── TournamentServiceImpl.java
│   │   │                   ├── RoundServiceImpl.java
│   │   │                   ├── MatchServiceImpl.java
│   │   │                   ├── StandingServiceImpl.java
│   │   │                   ├── EloRatingServiceImpl.java
│   │   │                   ├── SwissPairingServiceImpl.java
│   │   │                   └── TieBreakerServiceImpl.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       ├── application-prod.properties
│   │       └── db/
│   │           └── migration/
│   │               ├── V1__create_tables.sql
│   │               └── V2__insert_initial_data.sql
│   └── test/
│       └── java/
│           └── com/
│               └── chesstournament/
│                   ├── controller/
│                   ├── service/
│                   └── repository/
├── pom.xml
└── README.md
```

## Uruchomienie aplikacji

### Wymagania
- Java 17+
- Maven 3.6+
- MySQL 8.0+

### Konfiguracja bazy danych
1. Utwórz bazę danych MySQL:
   ```sql
   CREATE DATABASE chess_tournament_planner;
   CREATE USER 'chess_app'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON chess_tournament_planner.* TO 'chess_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. Dostosuj konfigurację w `application.properties` lub zmiennych środowiskowych.

### Kompilacja i uruchomienie
```bash
# Sklonuj repozytorium
git clone https://github.com/your-username/chess-tournament-planner.git
cd chess-tournament-planner

# Zbuduj aplikację
mvn clean package

# Uruchom
java -jar target/chess-tournament-planner-0.0.1-SNAPSHOT.jar
```

Aplikacja będzie dostępna pod adresem: `http://localhost:8080`

Dokumentacja API Swagger: `http://localhost:8080/swagger-ui.html`

### Konfiguracja środowiskowa
Aplikacja obsługuje różne profile środowiskowe:
- `dev` - dla lokalnego rozwoju
- `prod` - dla środowiska produkcyjnego

Aby uruchomić z określonym profilem:
```bash
java -jar -Dspring.profiles.active=dev target/chess-tournament-planner-0.0.1-SNAPSHOT.jar
```

## Bezpieczeństwo

Aplikacja implementuje kompleksowe mechanizmy bezpieczeństwa:

1. **Uwierzytelnianie oparte na JWT**:
   - Tokeny z ograniczonym czasem ważności
   - Bezpieczne przechowywanie haseł (BCrypt)

2. **Autoryzacja oparta na rolach**:
   - Szczegółowa kontrola dostępu
   - Zabezpieczenia na poziomie endpointów i metod

3. **Walidacja danych wejściowych**:
   - Sanityzacja danych
   - Obsługa błędów z informacyjnymi komunikatami

## Autorzy

- Kacper Więckowski
- Witold Brunka

## Licencja

Ten projekt jest objęty licencją MIT. Szczegóły można znaleźć w pliku LICENSE.
