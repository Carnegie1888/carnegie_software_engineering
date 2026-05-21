# Overlapping Files and Defense Attribution

[Back to Overview](Overview.md)

## Explanation Principles

"Current Corresponding Code Files" in member documentation is used to show the code scope each person has participated in, depends on, or needs to explain. Some files appear in multiple member documents because the project underwent architecture restructuring in the later stage, and business modules also have genuine collaborative relationships.

Handle during defense according to these rules:

- **Primary attribution**: Responsible for explaining the file's design, core logic, test points, and main risks.
- **Collaboration/dependency**: May explain why their business uses the file, without repeating the full implementation of the file.
- member1 through member5 business defenses use "primary attribution" as the standard. member6's overlaps are more of a leader perspective on architecture coverage, not representing repeated claiming of every business file.

## Overlapping Files for member1 through member5

| Overlapping File | Appears In | Defense Primary | Collaboration/Dependency Explanation |
| --- | --- | --- | --- |
| `backend/src/com/example/tarecruitment/common/storage/StoragePaths.java` | member2, member3 | member2 | member3's position module and config tests depend on runtime data directory. |
| `backend/src/com/example/tarecruitment/common/search/FuzzySearchUtil.java` | member3, member4 | member3 | member4's application/stats documentation involves filtering and search capability. |
| `backend/src/com/example/tarecruitment/admin/service/WorkloadStatsService.java` | member3, member4 | member3 | member4 explains how application status, hiring, and withdrawal affect statistics calculation. |
| `backend/src/com/example/tarecruitment/admin/web/WorkloadStatsServlet.java` | member3, member4 | member3 | member4 explains the business relationship between application flow and statistics interface. |

## Defense Focus for Each Member

| Member | Defense Focus | How to Handle Overlapping Files |
| --- | --- | --- |
| member1 | Authentication, Session, permissions, unified response, and logging utilities | Authentication and common return structure presented by member1. |
| member2 | TA profiles, file upload, CSV/data paths, DeepSeek recommendation search | `StoragePaths.java` presented by member2. AI recommendation search presented by member2. |
| member3 | Position posting/query/validation, workload statistics, account profile sync | Workload statistics and search utility presented by member3. |
| member4 | Application flow, status transitions, notifications, admin invite code business | Workload statistics and common utility only explain business usage scenarios, not repeat implementation. |
| member5 | Frontend pages, interactions, styles, page JS API call methods | member5 has no direct code path overlap with member1 through member4. |

## Special Note for member6

member6 is the project leader and architecture organization role. Documentation may cover common frontend, common backend, scripts, documentation, and architecture migration files. member6's defense focus is "whether the overall structure is unified, old interfaces are cleaned up, and frontend/backend routing is synchronized", not seizing primary attribution of business implementation from member1 through member5.