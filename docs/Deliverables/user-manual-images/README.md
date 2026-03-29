# User Manual Screenshots

This directory contains screenshots for the TARecruitmentSystem User Manual.

## Screenshot Specifications

- **Format**: PNG
- **Recommended Resolution**: 1920x1080 or higher
- **Browser Frame**: Remove browser chrome, show only the application content
- **File Naming**: Use lowercase with hyphens (e.g., `login.png`)

## Required Screenshots

| File Name | Source Page | Content Description |
|-----------|-------------|---------------------|
| `login.png` | `/login.jsp` | Full login interface with username/password fields and role selector |
| `register.png` | `/register.jsp` | Registration page with role selection and form fields |
| `ta-dashboard.png` | `/jsp/ta/dashboard.jsp` | TA dashboard showing profile summary and quick actions |
| `ta-job-list.png` | `/jsp/ta/job-list.jsp` | Available job positions list |
| `ta-application-status.png` | `/jsp/ta/application-status.jsp` | Application status tracking page |
| `mo-dashboard.png` | `/jsp/mo/dashboard.jsp` | MO dashboard with stats and pending applications |
| `mo-applicant-selection.png` | `/jsp/mo/applicant-selection.jsp` | Applicant review with accept/reject buttons |
| `mo-ai-skill-match.png` | `/jsp/mo/ai-skill-match.jsp` | AI skill matching analysis visualization |
| `admin-dashboard.png` | `/jsp/admin/dashboard.jsp` | Admin dashboard with system stats and workload charts |

## Usage in Markdown

After saving screenshots with the filenames above, they will be automatically displayed in the user manual at the following locations:

```
![登录页面](user-manual-images/login.png)      -- Section 2.2
![注册页面](user-manual-images/register.png)    -- Section 2.3
![TA Dashboard](user-manual-images/ta-dashboard.png)           -- Section 5.0
![TA Job List](user-manual-images/ta-job-list.png)             -- Section 5.4
![TA Application Status](user-manual-images/ta-application-status.png) -- Section 5.5
![MO Dashboard](user-manual-images/mo-dashboard.png)            -- Section 6.0
![MO Applicant Selection](user-manual-images/mo-applicant-selection.png) -- Section 6.3
![MO AI Skill Match](user-manual-images/mo-ai-skill-match.png)  -- Section 6.5
![Admin Dashboard](user-manual-images/admin-dashboard.png)      -- Section 7.0
```

## Notes

1. For login screenshots, use demo accounts from the user manual:
   - TA: `ta_demo` / `Pass1234`
   - MO: `mo_demo` / `Pass1234`
   - Admin: `admin_demo` / `Pass1234`

2. Ensure data visibility by populating with demo data before taking screenshots

3. For Admin dashboard, ensure TA workload statistics are visible
