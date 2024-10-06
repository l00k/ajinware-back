## Instalacja i kompilacja

Projekt zawiera konfiguracje [NVM](https://github.com/nvm-sh/nvm)
`nvm use`
oraz [direnv](https://direnv.net/)
`direnv allow`

Projekt powstał przy wykorzystaniu wersji Node 20.12 w trybie ESM

```bash
yarn
yarn build
```

Ponieważ wsparcie dla ESM w pakiecie `ts-node` jest beznadziejne (problemy z "compilerOptions.paths"),
z kolei `tsx` nie wspiera funkcji związanych z dekoratorami w katalogu `dev/` znajdują się
skrypty ułatwiające uruchamianie projektu w trybie deweloperskim.

```bash
dev/run test # uruchamia testy
dev/run coverage # uruchamia testy z pokryciem kodu
dev/run [-w] [-i] dev src/main.ts # uruchamia projekt w trybie deweloperskim (bez kompilacji - wprost z TS)
```

## Lokalne testowanie

W ramach testów E2E dotyczących synchronizacji między mikroserwisami
przygotowany jest skrypt `docker/test/start.sh` przygotowujący środowisko testowe.
Przed uruchomieniem testów wymagane jest urchomienie go.

Skrypt upewnia się, że wszystkie niezbędne pliki i katalogi zostały stworzone, a następnie uruchamia kontenery z
mikroserwisami.

```bash
cd docker/test
./start.sh
```

Po uruchomieniu kontenerów można uruchomić testy z katalogu głównego

```bash
dev/run test
```

## Kolekcja PostMan

W katalogu `postman/` znajduje się kolekcja PostMan z przykładowymi requestami do API.

## Opis implementacji w odniesieniu do zadania

> API dla Systemu Kolejek Górskich

API zaimplementowane z wykorzystaniem express.js. Nie widziałem nigdzie wzmianki, żebyście korzystali z
Nest.js więc nie korzystałem tutaj.  
Implementacja abstrakcji API w `src/service/api/*`  
Implementacja konkretnych endpointów w kontrolerach `src/service/controller/*`

> Nasłuchuje na porcie 3050, niedostępna dla osób z zewnątrz

Konfiguracja pod kluczem `api.port`

> Wyświetla wszystkie logi (.log, .error, .warn) wyświetlają się w konsoli

Konfiguracja pod kluczem `logger.logLevel`

> Ograniczenia: Dane na wersji deweloperskiej nie mogą kolidować z danymi na
> wersji produkcyjnej

Każda wersja definiowana jest przez zmienną środowiskową `APP_ENV`.  
Ponadto pliki zapisywane są do osobnych katalogów na podstawie konfiguracja w
plikach `src/etc/config/<env>.ts` pod kluczem `logger.storagePath` i `db.storagePath`

> zakładamy, że Redis jest uruchomiony na zewnętrznej maszynie, do której dostęp
> mamy poprzez adres IP i port

Konfiguracja pod kluczem `sync.url`
Ponadto każda instancja musi zdefiniować identyfikator węzła pod kluczem `sync.peerId` lub przez
zmienną środowiskową `PEER_ID`

> w praktyce oznacza to, że w konfiguracji projektu nie tworzymy kontenera Redis
> w Docker Compose, ale zamiast tego aplikacja powinna połączyć się z Redisem
> uruchomionym na tej samej maszynie, używając zdefiniowanego adresu IP i portu

Konfiguracja produkcyjna `docker/dist/docker-compose.yml`

> Zarządzanie kolejkami i wagonami  
> (...)  
> Zarządzanie personelem (p)  
> (...)  
> Zarządzanie klientami
> (...)

Logika biznesowa znajduje się w `src/model/Coaster.ts`

> jeśli kolejka nie będzie w stanie obsłużyć wszystkich klientów w ciągu dnia, system
> informuje o tym i wylicza, ile brakuje wagonów oraz personelu

Ponieważ każdy wagon ma własną prędkość - nie jest to rzetelna informacja.
W praktyce pod uwagę jest brany pierwszy wagon z kolejki (jako wzorzec) - tak jakby kolejno
dodane wagony miały być tego typu.

> jeśli kolejka górska ma więcej mocy przerobowych niż wymagane, tj. obsłuży ponad
> dwukrotnie więcej klientów niż zaplanowano, system informuje o nadmiarowej
> liczbie wagonów i personelu

Podobna sytuacja - ustalamy zbędne wagony pokrywająć zapotrzebowanie
od pierwszego wagonu do ostatniego aż do osiągnięcia wymaganego poziomu. Reszta wagonów uznawana jest za zbędne.
Ale ponieważ każdy wagon ma inną prędkość w praktyce decyzja biznesowa mogłaby być inna.

> Rozproszony system zarządzania:
> (...)

Implementacja synchronizacji w `src/service/sync/*`  
Niskopoziomowa implementacja w `src/service/sync/SyncProvider.ts` tutaj zaimplementowane jest
elekcja master noda i obsługa fail over oraz rejestracja w systemie Pub / Sub.  
Implementacja logiki zwiazanej z eventami (czyli w praktyce aktualizacja danych w bazie)
w `src/service/sync/SyncManager.ts`

> Statystyki i monitorowanie (konsola):

Za wyświetlanie statystyk odpowiada `src/service/MonitoringService.ts`

## Wątpilości co do synchronizacji

> Synchronizacja danych:
> 1. synchronizacja danych między węzłami działa asynchronicznie, co oznacza, że
     operacje w systemie nie są blokowane w oczekiwaniu na pełną synchronizację
     danych między wszystkimi kolejkami
> 2. zmiany wprowadzone w jednym węźle (np. aktualizacja kolejki A1 z komputera
     obsługującego kolejkę A3) są natychmiast wprowadzane lokalnie, a synchronizacja
     z innymi węzłami następuje w tle

Tutaj pragnę wspomnieć moje wątpliości co do potencjalnych problemów związanych z synchronizacją. W przypadku
konfliktów.

> Wyobraźmy sobie sytuację:
> - W sieci są 3 węzły A (master), B i C.
> - Wszystko działa poprawnie i wszystkie węzły są w pełnej synchronizacji.
> - A i B wyłączają się z sieci. 
> - Węzeł C staje się masterem.
> - Użytkownicy wprowadzają zmiany (które nie są rozpowszechnione do A i B).
> - Węzeł C również zostaje wyłączony. 
> - Węzły A i B zostają ponownie uruchomione. Jeden z nich staje się masterem.
> - Użytkownicy wprowadzają zmiany.
> - Węzeł C zostaje uruchomiony.
> - Następuje konflikt. A i B choć są ze sobą zsynchronizowane nie zawierają tego co C natomiast zawierają swoje
    zmiany - podobnie C.

Oraz odpowiedzi

> Główny węzeł - master  
> Poboczny węzeł - slave  
> Nie powinno być problemu dla tego przypadku. Węzeł wprowadza zmiany najpierw u siebie (lokalnie), następnie wysyła tę
> informację do mastera, który rozsyła tę informację do reszty slave. 

**Na tym poprzestałem w swojej implementacji**  
Wydaje mi się to niewystarczające, ale nie chcę tracić czasu na wymianę korespondencji w tej sprawie :)  
Będzie można to omówić na ewentualnej rozmowie technicznej. 

> Jeśli slave jest odłączony od sieci, nie wyśle zmian
> do mastera i tak samo nie pobierze zmian, działa sobie tylko lokalnie. Przy połączeniu nowego węzła, należy
> zsynchronizować dane między sobą.

> Zasadą mastera jest rozsyłanie synchronizacja danych między węzłami.  
> Pokrywa się to z tym, co napisałeś. Być może treść zadania źle to wskazuje - centralny węzeł ogranicza się do "synchronizacji danych".  

Co do tego mam wątpliwości bo "gdy więcej niż jedna kolejka jest podłączona do sieci, jeden z systemów przejmuje
rolę centralnego węzła, zarządzającego wszystkimi kolejkami".

> Podpowiedź: synchronizacja danych nie oznacza, że te dane muszą się zapisywać na każdym węźle. Tak samo, gdy slave jest
> odłączony od sieci, nie potrzebuje posiadać danych z innych węzłów.

Każdy węzeł może stać się masterem (jeśli akurat jako jedyny jest podłączony), stąd IMO każdy węzeł powinien posiadać
dane ze wszystkich innych węzłów.
