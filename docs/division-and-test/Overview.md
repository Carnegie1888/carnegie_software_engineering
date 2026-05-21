# Team Division and Current Code Files

[Back to Overview](Overview.md)

## Overall Division of Labor

| Member | File | Git Author | Standard Commit Count | Division Overview |
| --- | --- | --- | --- | --- |
| `member1` | [member1.md](member1.md) | `member1 <member1@edu.com>` | 18 | Backend foundational capabilities, authentication flow, API response and logging utilities, early skill matching implementation, partial testing/stats contribution |
| `member2` | [member2.md](member2.md) | `member2 <member2@edu.com>` | 20 | TA profile and file upload, data path/initialization stability, AI recommendation search and matching service |
| `member3` | [member3.md](member3.md) | `member3 <member3@edu.com>` | 19 | Position posting/query/validation, workload statistics interface, account profile sync, AI config templates |
| `member4` | [member4.md](member4.md) | `member4 <member4@edu.com>` | 23 | Application flow, status transitions, TA withdrawal, MO selection, notifications and invite code service, integration testing/early user manual work |
| `member5` | [member5.md](member5.md) | `member5 <member5@edu.com>` | 34 | Frontend pages and interactions, covering login/register, TA/MO/Admin pages, frontend API routing unification |
| `member6` | [member6.md](member6.md) | `member6 <member6@edu.com>` | 41 | Project leader / architecture restructuring, common configuration, documentation/scripts organization, portal shell, common styles, Admin pages and full-site bilingual resources |

## Individual Test Presentation Entry

Each member only needs to run their own script during the defense, no need to run the unified total test.

For overlapping files and defense attribution, see: [overlap-and-defense-ownership.md](overlap-and-defense-ownership.md).

| Member | Test Command | Test Code |
| --- | --- | --- |
| `member1` | `./scripts/test/test-member1.sh` | `backend/test/Member1BackendTest.java` |
| `member2` | `./scripts/test/test-member2.sh` | `backend/test/Member2BackendTest.java` |
| `member3` | `./scripts/test/test-member3.sh` | `backend/test/Member3BackendTest.java` |
| `member4` | `./scripts/test/test-member4.sh` | `backend/test/Member4BackendTest.java` |
| `member5` | `./scripts/test/test-member5.sh` | `frontend/test/member5-frontend-test.js` |
| `member6` | `./scripts/test/test-member6.sh` | `frontend/test/member6-architecture-test.js` |