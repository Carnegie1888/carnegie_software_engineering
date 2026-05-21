# member3 Division and Current Code Files

[Back to Overview](Overview.md)

## Basic Information

| Item | Content |
| --- | --- |
| Git author | `member3 <member3@edu.com>` |
| Standard commit count | 19 |
| Division overview | Position posting/query/validation, workload statistics interface, account profile sync, AI config templates |

## Division Overview

`member3` primarily took on the position module and validation logic: position creation, list filtering, edit/delete, structured field validation, and position active status handling. Also contributed part of the backend capability for admin/MO workload statistics, and later added account profile sync updates.

## Current Corresponding Code Files

Position posting, position list, structured fields, and validation:

- `backend/src/com/example/tarecruitment/job/model/Job.java`
- `backend/src/com/example/tarecruitment/job/dao/JobDao.java`
- `backend/src/com/example/tarecruitment/job/mapper/JobRequestMapper.java`
- `backend/src/com/example/tarecruitment/job/mapper/JobResponseMapper.java`
- `backend/src/com/example/tarecruitment/job/service/JobService.java`
- `backend/src/com/example/tarecruitment/job/validator/JobValidator.java`
- `backend/src/com/example/tarecruitment/job/web/JobServlet.java`

Account profile sync:

- `backend/src/com/example/tarecruitment/profile/mapper/AccountProfileResponseMapper.java`
- `backend/src/com/example/tarecruitment/profile/service/AccountProfileService.java`
- `backend/src/com/example/tarecruitment/profile/validator/AccountProfileValidator.java`
- `backend/src/com/example/tarecruitment/profile/web/AccountProfileServlet.java`

Workload statistics:

- `backend/src/com/example/tarecruitment/admin/service/WorkloadStatsService.java` (**Overlap note: member3 primary; member4's application flow affects statistics calculation**)
- `backend/src/com/example/tarecruitment/admin/web/WorkloadStatsServlet.java` (**Overlap note: member3 primary; member4's application flow affects statistics calculation**)

Related common capabilities:

- `backend/src/com/example/tarecruitment/common/search/FuzzySearchUtil.java` (**Overlap note: member3 primary; member4's application/stats documentation relies on search capability**)
- `backend/src/com/example/tarecruitment/common/storage/StoragePaths.java` (overlap file, member2 defense primary)

## File Overlap and Defense Attribution

- `backend/src/com/example/tarecruitment/admin/service/WorkloadStatsService.java` and `backend/src/com/example/tarecruitment/admin/web/WorkloadStatsServlet.java` also appear in member4's documentation because workload statistics need to read application status and hiring results. During defense, the statistics interface and rules are presented by member3. Member4 only explains how application status affects statistics results.
- `backend/src/com/example/tarecruitment/common/search/FuzzySearchUtil.java` also appears in member4's documentation because application/stats documentation will mention filtering and search capability. During defense, the search utility is presented by member3.
- `backend/src/com/example/tarecruitment/common/storage/StoragePaths.java` also appears in member2's documentation. During defense, the data path infrastructure is presented by member2. Member3 only explains how the position module depends on it for reading test data directory.

## Test Presentation

Run command:

```bash
./scripts/test/test-member3.sh
```

Test code:

- `backend/test/Member3BackendTest.java`

Test coverage points:

- `JobValidator` accepts valid positions and rejects dangerous titles, duplicate skills, and incorrect separators.
- `Job` active status can automatically change from `OPEN` to `CLOSED` based on deadline.
- `JobDao` can create positions, search position fields, and update position status.
- `AccountProfileValidator` validates usernames, TA real names, and upload filenames.

For defense, you can explain:

`member3`'s test focus is on position posting, structured validation, and account profile sync. The tests verify not only "positions can be created" but also that invalid inputs are blocked by the backend, such as duplicate skills, dangerous HTML, and illegal usernames. This demonstrates that the position module is not just limited by the frontend, but also has backend rules as a safety net.