# TARecruitmentSystem Software Engineering System User Manual

## 1. Document Overview

This manual is intended to help TA, MO, and Admin users complete common business operations in the system, including:

- Account registration and login
- Profile management and resume upload
- Job posting and application review
- Viewing AI capability results (skill matching / missing skills)
- Administrative statistics and export

---

## 2. System Access

- Default entry point: `http://localhost:8080/groupproject/`
- Login page: `/login.jsp`
- Registration page: `/register.jsp`

If the port has been changed, please use the port configured in your local Tomcat environment.

### 2.1 Development Demo Accounts

For development and demonstration, the system provides the following fixed accounts:

| Role  | Username     | Password   |
| ----- | ------------ | ---------- |
| TA    | `ta_demo`    | `Pass1234` |
| MO    | `mo_demo`    | `Pass1234` |
| Admin | `admin_demo` | `Pass1234` |

If any of these accounts are missing from the local user CSV files, the backend will recreate them automatically during application startup.

---

## 3. Roles and Permissions

### 3.1 TA (Applicant)

- Create or update a personal profile
- Upload a resume
- Browse jobs and submit applications
- View application status

### 3.2 MO (Module Organizer)

- Publish and maintain job postings
- View the applicant list
- Accept or reject applications
- View missing-skill visualization results

### 3.3 Admin (Administrator)

- View global workload statistics
- View processing load by MO
- Filter by time range and export CSV data

---

## 4. First-Time Usage Flow

1. Open the registration page, choose the appropriate role, and create an account.
2. After logging in, enter the corresponding dashboard based on your role.
3. TA users should complete their profile and skills before applying for jobs.
4. MO users should publish jobs first, then review candidates on the application management page.
5. Admin users can access the statistics interface to view system workload data.

---

## 5. TA User Guide

### 5.1 Create a Profile

On the TA page, fill in:

- Name, student ID, department, and program (Bachelor's / Master's / PhD)
- Skill list (comma-separated format is recommended)
- GPA, phone number, address, experience, and motivation

### 5.2 Upload a Resume

- Supported formats: PDF, DOC, DOCX
- Maximum file size: 10MB
- After upload, the system saves a relative file path for later review

### 5.3 Apply for a Job

On the job list page, select a job, fill in the cover letter, and submit it.  
After submission, you can view the following statuses on the application status page:

- `PENDING` Waiting for review
- `ACCEPTED` Accepted
- `REJECTED` Rejected
- `WITHDRAWN` Withdrawn

---

## 6. MO User Guide

### 6.1 Publish a Job

The following basic job information must be provided:

- Job title, course code, and course name
- Description, required skills, number of openings, workload, salary, and deadline

### 6.2 Review Applications

On the application review page, you can:

- View applicant information and cover letters
- Accept or reject applications in `PENDING` status

### 6.3 Missing Skills Analysis

Through the missing skills interface, you can view:

- Matching results and missing items for an individual applicant
- Aggregated frequency of missing skills
- Recommended improvement suggestions

---

## 7. Admin User Guide

### 7.1 Total Application Statistics

The statistics interface can return the global distribution of application statuses:

- Total number of applications
- Number pending
- Number accepted
- Number rejected
- Number withdrawn

### 7.2 MO Workload Statistics

You can view the following by MO:

- Total processing volume
- Number pending
- Number processed
- Distribution of accepted / rejected / withdrawn applications

### 7.3 Time Range Filtering and Export

The interface supports `start/end` parameters for time-based filtering.  
Set `export=csv` to download the statistics for external reporting and analysis.

---

## 8. Frequently Asked Questions

### 8.1 Login Failed

- Check whether the username/email and password are correct
- Check whether the selected login role matches the role of the account

### 8.2 Unable to Upload Resume

- Check whether the file format is PDF/DOC/DOCX
- Check whether the file size exceeds 10MB

### 8.3 Statistics Data Is Not Visible

- Confirm that the current account has the required permissions (Admin or MO)
- Confirm that the session has not expired; log in again if necessary

---

## 9. Maintenance Recommendations

- After each iteration, update the page paths and interface descriptions in this manual
- When new permission controls or field validation are added, update the "Roles and Permissions" and "Frequently Asked Questions" sections
