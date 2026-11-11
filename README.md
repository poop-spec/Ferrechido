# Ferrechido

Expo inventory app with Microsoft Entra External ID sign-in, a protected Azure Functions API, and Azure SQL storage.

## What is connected

- The app uses the External ID hosted user flow for sign-up/sign-in. No password is stored by this app.
- Inventory reads and CRUD operations use the Functions API. There is no local/demo inventory fallback.
- The API validates Entra bearer tokens and uses the Function App managed identity (or a developer's Azure CLI identity locally) to connect to SQL.
- The API and database schema are in `api/`.

## Configure Microsoft Entra External ID

Create an External ID tenant and a sign-up/sign-in user flow. Register two applications:

1. **Mobile app:** a public/native client (no client secret). Add this redirect URI under the mobile/desktop platform: `ferrechido://redirect`.
2. **Inventory API:** expose a delegated scope named `access_as_user`, and grant/consent to that scope for the mobile app.

Use the API scope URI shown in Entra (commonly `api://<api-client-id>/access_as_user`). Set the API app's accepted audience to the corresponding audience value.

Copy `.env.example` to `.env` and set:

| Variable | Value |
|---|---|
| `EXPO_PUBLIC_ENTRA_CLIENT_ID` | Mobile app's application (client) ID |
| `EXPO_PUBLIC_ENTRA_TENANT_DOMAIN` | External tenant domain, e.g. `example.ciamlogin.com` (no scheme) |
| `EXPO_PUBLIC_ENTRA_TENANT_ID` | External tenant ID |
| `EXPO_PUBLIC_ENTRA_USER_FLOW` | Sign-up/sign-in user-flow name |
| `EXPO_PUBLIC_ENTRA_API_SCOPE` | API delegated scope URI |
| `EXPO_PUBLIC_API_URL` | Functions base URL, e.g. `https://ferrechido-api.azurewebsites.net` |

These are public app configuration values, not secrets. Do not put SQL passwords, client secrets, or signing keys in the Expo app. The redirect scheme is declared in `app.json`; test native sign-in with an Expo development build if Expo Go cannot handle the custom scheme.

## Create and configure Azure resources

1. Create an Azure SQL logical server and database. Run `api/sql/schema.sql` against the database.
2. Create a Node.js Azure Function App (Functions v4, Node.js 22).
3. Enable the Function App's system-assigned managed identity. Create a contained database user for that identity and grant only the needed table permissions:

   ```sql
   CREATE USER [<function-app-name>] FROM EXTERNAL PROVIDER;
   GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Products TO [<function-app-name>];
   ```

4. Configure the Function App settings `SQL_SERVER` (the SQL server FQDN), `SQL_DATABASE`, `AUTH_ISSUER`, `AUTH_AUDIENCE`, `AUTH_REQUIRED_SCOPE` (normally `access_as_user`), and `AUTH_JWKS_URI`. Use the issuer and signing-keys endpoint published by the External ID tenant's OpenID Connect metadata for the selected user flow. The sample settings file shows the expected formats.
5. Restrict Azure SQL networking to the Function App and trusted developer access. Configure Function App CORS if you will run the Expo web app; native clients do not use browser CORS.

For local API development, copy `api/local.settings.example.json` to `api/local.settings.json`, fill in the same values, sign in with `az login`, and grant the developer's Entra identity access to the database. Start Azurite or change the local storage setting to a development storage account.

## Run

```powershell
npm install
Copy-Item .env.example .env
npm run typecheck
npx expo start
```

In another terminal:

```powershell
Set-Location api
npm install
npm run build
npm start
```

The local Functions host requires Azure Functions Core Tools. Its endpoints are `GET/POST /api/products` and `PUT/PATCH/DELETE /api/products/{id}`. Every endpoint requires a valid `Authorization: Bearer <access-token>` token for the API audience.

## Azure DevOps

`azure-pipelines.yml` runs app type-checking and builds the Functions API on pushes and pull requests to `main`. In Azure DevOps, create/select a Git repository, push this workspace, and create a pipeline that uses this YAML file. This workspace currently has no Git remote configured, so these changes have not been pushed to the linked project.

To deploy the API from a pipeline, add an Azure Resource Manager service connection and a deployment stage targeting the Function App. Keep SQL and Entra settings in Function App configuration or a secure variable group; never commit them.
