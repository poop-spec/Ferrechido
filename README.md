# Ferrechido

Expo inventory app with no sign-in. Inventory data is stored locally on the device.

## What is connected

- Product create, edit, restock, and delete operations are saved using device-local storage. Data is not synced between devices and may be removed if the app is uninstalled or its data is cleared.
- The first launch loads sample inventory. Product forms can capture the device's foreground location (with permission); product details can open those coordinates in a map.
- The Azure Functions API and SQL database remain in `api/`, but the mobile app does not call them. The API remains protected by Entra bearer-token validation.

## Create and configure Azure resources

1. Create an Azure SQL logical server and database. Run `api/sql/schema.sql` against the database. For an existing installation, run `api/sql/add-product-location.sql` to add the nullable product coordinates.
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
npm run typecheck
npx expo start
```

The Azure Functions API is optional and is not used by the local-only mobile app. To run it for separate API development:

```powershell
Set-Location api
npm install
npm run build
npm start
```

The local Functions host requires Azure Functions Core Tools. Its endpoints are `GET/POST /api/products` and `PUT/PATCH/DELETE /api/products/{id}`. Every endpoint requires a valid `Authorization: Bearer <access-token>` token for the API audience; do not make these endpoints anonymous.

## Azure DevOps

`azure-pipelines.yml` runs app type-checking and builds the Functions API on pushes and pull requests to `main`. In Azure DevOps, create/select a Git repository, push this workspace, and create a pipeline that uses this YAML file. This workspace currently has no Git remote configured, so these changes have not been pushed to the linked project.

To deploy the API from a pipeline, add an Azure Resource Manager service connection and a deployment stage targeting the Function App. Keep SQL and Entra settings in Function App configuration or a secure variable group; never commit them.
