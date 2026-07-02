Primary suspects:

- artifacts/api-server/src/app.ts
- artifacts/api-server/src/index.ts
- routing architecture migration
- ESM import changes (.js extensions removed)

These changes align closely with observed failures:

- ERR_MODULE_NOT_FOUND
- ERR_PACKAGE_PATH_NOT_EXPORTED
- ERR_UNKNOWN_FILE_EXTENSION
- API no longer listening on port 8080
