# CI/CD & deployment

```
 push to main ─► plan (which sites changed?) ─► test (build + smoke test, per site)
                                            └─► image (Docker build → read-only container test → Trivy scan → push)
                                                   └─► deploy (SSH → docker compose pull/up → health check → auto-rollback → live smoke test)
```
* Only changed sites are rebuilt and redeployed. Pull requests run build + tests + image build, never push or deploy.
* Images are tagged `sha-<commit>` (immutable) and `latest`. Each deploy pins the exact sha on the server.
* If a new version is not healthy within ~2 minutes, `deploy.sh` restores the previous config automatically.
* Containers run as non-root, read-only, all capabilities dropped, 256 MB limit, with persistent data in named volumes.

## One-time setup

**0. Rotate credentials that were shared in chat.** Revoke the Docker Hub access token and create a new one
(Docker Hub → Account settings → Personal access tokens → *Read & Write*). Keep the `.pem` outside the repo folder
(`chmod 400`). Both are git-ignored, but never commit them.

**1. AWS security group** (EC2 → Security groups → inbound): allow TCP **22**, **80**, **443**, **8082**.

**2. GitHub → repo → Settings → Secrets and variables → Actions**

Secrets
| Name | Value |
|---|---|
| `DOCKERHUB_TOKEN` | the **new** Docker Hub token |
| `SSH_PRIVATE_KEY` | full contents of the `.pem` file (including BEGIN/END lines) |
| `SSH_HOST` | server IP (`3.111.214.203`) |
| `SSH_USER` | `ubuntu` (Ubuntu AMI) or `ec2-user` (Amazon Linux) |
| `MONGODB_URI` | MongoDB connection string for customer/builder/admin accounts and saved designs (use a **new** DB user — rotate the one shared in chat) |
| `ADMIN_PASSWORD` | strong password for the first admin account of `tac-site-c` (used on first start only) |
| `SSH_KNOWN_HOSTS` | *(recommended)* output of `ssh-keyscan -H 3.111.214.203` run from a trusted machine |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `SMTP_FROM` | *(optional)* to email enquiries |

Variables
| Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | `awsmallick1999` |
| `DOCKER_PLATFORMS` | `linux/amd64` (use `linux/arm64` if the server is a Graviton `t4g/c7g/m7g` instance) |
| `ADMIN_EMAIL` | *(optional)* email of the first admin (default `admin@tacuae.com`). Sign in at `/login` |
| `ENQUIRY_TO` | *(optional)* e-mail that receives enquiries (default `info@tacuae.com`) |
| `C_SITE` | *(when you have a domain)* e.g. `tacuae.com, www.tacuae.com` → Caddy enables HTTPS automatically |
| `SMOKE_URL_C` | *(when you have a domain)* e.g. `https://tacuae.com` |
| `DEPLOY_ENABLED` | **`true`** — turn this on last; until then pushes only build and test |

**3. Environment protection (recommended):** Settings → Environments → `production` → *Required reviewers*, so every
deploy needs a click of approval.

**4. Prepare the server:** Actions → **CI/CD** → *Run workflow* → tick **bootstrap** (installs Docker, creates `/opt/tac`).
Run it once. Then push to `main` (or run the workflow with `sites = all`) to deploy.

## Day to day
* Merge to `main` → changed sites deploy automatically.
* **Rollback:** Actions → **Rollback** → choose site and an older `sha-…` tag.
* Logs: `ssh target 'cd /opt/tac && docker compose logs -f --tail 100 tac-c'`.
* Data lives in Docker volumes (`tac_c_data` holds the admin dashboard's enquiries and content). Back up with
  `docker run --rm -v tac_c_data:/d -v "$PWD":/b alpine tar czf /b/c-data.tgz -C /d .`

## Addresses
Without a domain (HTTP on the IP): `http://<ip>:8082` (dashboard `/admin`).
**Use a domain + HTTPS before using the admin dashboard in production** — over plain HTTP the password travels
unencrypted (until then, reach it through an SSH tunnel: `ssh -L 8082:localhost:8082 target`). Point DNS A records at the
server, set `C_SITE`, and redeploy.
