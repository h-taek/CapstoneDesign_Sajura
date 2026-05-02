# MySQL Docker 설정 및 설계 과정

이 문서는 프로젝트(Sajura) 데이터베이스를 위한 MySQL 도커 이미지 다운로드부터 컨테이너 생성 및 초기 세팅까지의 과정을 정리한 문서입니다.

## 1. 개요 및 설계 목적
* **목적**: 로컬/개발용 MySQL 환경을 일관성 있게 구축하기 위해 Docker를 사용. 팀원 누구나 쉽게 동일한 DB 환경을 구축할 수 있도록 합니다.
* **구조 설계**:
  * `Dockerfile`: MySQL 8.0 공식 이미지를 베이스로 가져오고, 환경 변수를 통해 루트 비밀번호, 기본 접속 유저 등을 설정.
  * `init.sh`: 데이터베이스가 처음 초기화될 때 권한 설정 등을 자동화하기 위해 작성된 스크립트.

## 2. 컨테이너 생성 및 초기화 과정 작동 원리
1. **이미지 다운로드**: `FROM mysql:8.0` 명령어로 Docker Hub에서 공식 이미지를 Pull 받아옵니다.
2. **초기 데이터베이스 및 관리자 생성**: Dockerfile의 `ENV` 키워드를 통해 `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` 등이 주입되며, MySQL 서버가 처음 시작할 때 자동으로 해당 DB와 유저를 생성합니다.
3. **유저 세팅 및 추가 설정 자동화 (`/docker-entrypoint-initdb.d/`)**:
   * MySQL 컨테이너는 부팅 시 `/docker-entrypoint-initdb.d/` 디렉토리를 스캔하여 안에 있는 SQL 스크립트를 실행합니다.
   * `init.sql` 파일을 이 폴더에 복사함으로써, 한글 처리를 위한 `utf8mb4` 문자셋 설정과 상세 권한(`GRANT`) 설정을 컨테이너가 켜지자마자 자동으로 적용되게 설계했습니다.

### 3.1. 컨테이너 자동 빌드 및 실행 (Docker Compose)
`docker-compose.yml` 파일이 작성되어 있으므로, 매우 간단하게 서버를 실행할 수 있습니다.
터미널을 열고 `Back/Docker/DB` 폴더로 이동한 뒤, 아래 명령어를 실행합니다. (백그라운드에서 실행됩니다)

```bash
cd Back/Docker/DB
docker-compose up -d --build
```

> **Tip:** 데이터베이스 데이터는 `db_data` 볼륨으로 영구 저장되도록 이미 설정되어 있습니다. 컨테이너를 중지하려면 `docker-compose down`을 사용하세요.

## 4. 접속 테스트
컨테이너가 실행된 후, DB 클라이언트 (DBeaver, DataGrip 등) 를 통해 접속이 잘 되는지 확인합니다.
* **Host**: 프로젝트 최상단의 `.env` 파일 내 `DB_HOST` 참고
* **Port**: `7000`
* **Database**: `.env` 파일 내 `DB_NAME` 참고
* **User**: `.env` 파일 내 `DB_USER` 참고
* **Password**: `.env` 파일 내 `DB_PASSWORD` 참고
