# AGENTS.md

## Cursor Cloud specific instructions

### Product overview
TA Recruitment Management System — Java Servlet + JSP web app on Apache Tomcat. No database; all persistence is CSV files in `data/`. See `README.md` for full architecture and demo accounts.

### Running the app
Tomcat is installed at `/opt/apache-tomcat-11.0.20`. The config is in `scripts/config.sh` (already set up; not committed to git).

```bash
cd scripts && chmod +x *.sh && ./onekey.sh   # build + deploy + start Tomcat
```

App URL: http://localhost:8080/groupproject/

If Tomcat is already running, just rebuild and redeploy (no restart needed):
```bash
cd scripts && ./build.sh && ./deploy.sh
```

### Demo accounts
| Role | Username | Password |
|------|----------|----------|
| TA | `ta_demo` | `Pass1234` |
| MO | `mo_demo` | `Pass1234` |
| Admin | `admin_demo` | `Pass1234` |

If `data/users.csv` is empty, register these accounts first via POST to `/groupproject/register` with fields `username`, `password`, `confirmPassword`, `email`, `role`.

### Running tests
Tests use plain `javac` + `java -ea` (no JUnit). See `README.md` "集成测试与回归验证" section for the compile-and-run pattern. Example:
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

Test files are under `backend/test/`. Each test class has a `main()` method.

### Gotchas
- `scripts/config.sh` is gitignored. If it doesn't exist, copy from `config.example.sh` and set `CATALINA_HOME=/opt/apache-tomcat-11.0.20`.
- The build script compiles each `.java` file individually in dependency order (no wildcard javac). If you add new source files, you must add them to `scripts/build.sh`.
- `UserDaoTest` has 1 pre-existing failing test ("Find by Role") — this is a known issue in the repo.
- No linter is configured for this project; code quality checks are manual.
- `JAVA_HOME` may need to be exported as `/usr` if Tomcat scripts fail to find the JDK.
