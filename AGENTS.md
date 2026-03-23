# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

TA Hiring Portal — a Java Servlet/JSP web app deployed on Apache Tomcat. No database; data is stored as CSV files under `data/`. See `README.md` for full architecture and directory layout.

### Runtime dependencies

- **JDK 21+** (pre-installed at `/usr/lib/jvm/java-21-openjdk-amd64`)
- **Apache Tomcat 11.x** (installed at `/opt/apache-tomcat-11.0.20`)

### Build / Deploy / Run

```bash
cd /workspace/scripts
./build.sh    # compile Java + copy frontend assets → build/
./deploy.sh   # copy build/ → Tomcat webapps/groupproject
./startup.sh  # start Tomcat on port 8080
```

Or one-key: `./onekey.sh` (build + deploy + startup).

The config lives in `scripts/config.sh` (not committed; created from `config.example.sh`). Key vars:

| Variable | Value |
|---|---|
| `CATALINA_HOME` | `/opt/apache-tomcat-11.0.20` |
| `CATALINA_OPTS` | `-Dta.hiring.data.dir=/workspace/data` |

### Starting Tomcat

Always export `JAVA_HOME` and `CATALINA_OPTS` before calling Tomcat scripts directly:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export CATALINA_OPTS="-Dta.hiring.data.dir=/workspace/data"
/opt/apache-tomcat-11.0.20/bin/startup.sh
```

Or use `scripts/startup.sh` which sources `config.sh` automatically.

App URL: `http://localhost:8080/groupproject/`

### Stopping Tomcat

```bash
/opt/apache-tomcat-11.0.20/bin/shutdown.sh
```

### Running tests

Tests use lightweight `main + assert` pattern (no JUnit). Compile source + test with `javac`, then run with `java -ea`. Example:

```bash
cd /workspace
rm -rf /tmp/build-test && mkdir /tmp/build-test
javac -encoding UTF-8 -d /tmp/build-test \
  backend/src/com/example/authlogin/util/StoragePaths.java \
  backend/src/com/example/authlogin/model/User.java \
  backend/src/com/example/authlogin/dao/UserDao.java \
  backend/test/com/example/authlogin/integration/LoginRegisterIntegrationTest.java
java -ea -cp /tmp/build-test com.example.authlogin.integration.LoginRegisterIntegrationTest
```

Test classes are under `backend/test/`. All 8 test files can be compiled and run individually; see `README.md` for more detail.

### Demo accounts

| Role  | Username     | Password   |
|-------|-------------|------------|
| TA    | `ta_demo`   | `Pass1234` |
| MO    | `mo_demo`   | `Pass1234` |
| Admin | `admin_demo`| `Pass1234` |

Accounts are auto-seeded if missing from CSV on startup.

### Gotchas

- `scripts/config.sh` is git-ignored. The update script recreates it each run.
- `build.sh` checks for `servlet-api.jar` inside `$TOMCAT_HOME/lib/`. If Tomcat is not installed, the build fails.
- The `UserDaoTest` "Find by Role" test has a pre-existing flaky assertion (counts demo accounts that get auto-seeded); this is not an environment issue.
- After re-deploying (`deploy.sh`), you do **not** need to restart Tomcat — just refresh the browser. But after Java source changes, you must re-run `build.sh` + `deploy.sh`.
