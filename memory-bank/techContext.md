# Technical Context

## Tech Stack
- **Frontend:** React 18+ with TypeScript, standard Nordstrom component library
- **Backend:** Java 17+ with Spring Boot 3.x
- **Database:** PostgreSQL 15+
- **File Processing:** Apache POI (Excel parsing)
- **Messaging:** Kafka for async processing (upload ingestion, report generation)
- **Infrastructure:** Standard Kubernetes with Helm charts

## Infrastructure
- Standard Nordstrom K8s platform
- CI/CD via GitHub Actions
- Secrets via Vault / K8s secrets
- Staging and production environments

## Integrations
| System | Method | Purpose |
|--------|--------|---------|
| OKTA | OIDC/SCIM API | Auth, user profiles, manager-report relationships |
| Microsoft Graph API | REST (OAuth2) | Org hierarchy, Outlook calendar OOO events, Teams notifications |
| Workday | REST API (RaaS/SOAP) | Approved leave records (PTO, sick, bereavement, etc.) |
| Company Calendar | REST API or iCal feed | Company holidays and office closures |
| Nordstrom SSO | SAML 2.0 / OIDC | Single sign-on |
| Badge Scan Data | Excel file upload (.xlsx) | Historical badge entry records |

## Constraints
- Badge data comes as Excel uploads (not real-time API)
- Workday API access may require integration partner or RaaS report
- Microsoft Graph calendar permissions may need admin consent (Calendars.Read)
- OKTA and Microsoft Graph both provide org hierarchy — need at least one

## Security Requirements
- RBAC: Employee, Manager, Director/VP, HR Partner
- PII masking in logs (employee names, emails)
- Uploaded Excel files scanned for malware
- Manager sees only their direct org tree
- Audit log for all approvals, rejections, uploads, data changes

<!-- Updated: 2026-02-24 -->
